"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getServerSession } from "@/lib/auth/session"
import { normalizeLiveSourceUrl } from "@/lib/live-source"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import {
  LIVE_SOURCE_CONTEXT_COOKIE,
  serializeLiveSourceContext,
} from "@/server/services/source-connection-state-service"
import { getSourceUsageForOrganization } from "@/server/services/source-entitlement-service"
import { getEntitlementsForOrganization } from "@/server/services/entitlement-service"
import { triggerQueuedScanTask } from "@/server/services/scan-task-service"
import type { Json } from "@/types/database"

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {}
  }
  return input as Record<string, unknown>
}

function isPrimaryUrlSourceMetadata(metadata: unknown) {
  const record = asRecord(metadata)
  return record.is_primary_source === true || record.source_role === "primary_url"
}

async function upsertPrimaryUrlSourceLane(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  organizationId: string
  normalizedUrl: string
  normalizedDomain: string
  connectedSystemProviders: string[]
}) {
  const integrationMetadata = {
    source_entity_type: "website_domain",
    live_source_url: input.normalizedUrl,
    live_source_domain: input.normalizedDomain,
    primary_live_source_url: input.normalizedUrl,
    primary_live_source_domain: input.normalizedDomain,
    primary_live_source_updated_at: new Date().toISOString(),
    is_primary_source: true,
    source_role: "primary_url",
    connected_systems: [
      "checkoutleak_connector",
      ...input.connectedSystemProviders.filter(
        (provider) => provider === "shopify" || provider === "stripe"
      ),
    ],
  }

  const existingDomainStore = await input.admin
    .from("stores")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("platform", "website")
    .eq("domain", input.normalizedDomain)
    .maybeSingle()

  if (existingDomainStore.error) {
    return { ok: false as const }
  }

  const connectorResult = await input.admin
    .from("store_integrations")
    .select("id, store_id, metadata, installed_at, created_at")
    .eq("organization_id", input.organizationId)
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (connectorResult.error) {
    return { ok: false as const }
  }

  const connectorRows = connectorResult.data ?? []
  const primaryConnector =
    connectorRows.find((row) => isPrimaryUrlSourceMetadata(row.metadata)) ??
    connectorRows[0] ??
    null

  const fallbackWebsiteStore = !existingDomainStore.data && !primaryConnector
    ? await input.admin
        .from("stores")
        .select("id")
        .eq("organization_id", input.organizationId)
        .eq("platform", "website")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : null

  if (fallbackWebsiteStore?.error) {
    return { ok: false as const }
  }

  let storeId = existingDomainStore.data?.id ?? primaryConnector?.store_id ?? fallbackWebsiteStore?.data?.id ?? null

  if (storeId) {
    const updateStore = await input.admin
      .from("stores")
      .update({
        name: `${input.normalizedDomain} Source`,
        domain: input.normalizedDomain,
        active: true,
      })
      .eq("id", storeId)
      .eq("organization_id", input.organizationId)
      .select("id")
      .single()

    if (updateStore.error || !updateStore.data) {
      return { ok: false as const }
    }

    storeId = updateStore.data.id
  } else {
    const insertStore = await input.admin
      .from("stores")
      .insert({
        organization_id: input.organizationId,
        name: `${input.normalizedDomain} Source`,
        platform: "website",
        domain: input.normalizedDomain,
        timezone: "UTC",
        currency: "USD",
        active: true,
      })
      .select("id")
      .single()
    if (insertStore.error || !insertStore.data) {
      return { ok: false as const }
    }
    storeId = insertStore.data.id
  }

  const existingIntegration = await input.admin
    .from("store_integrations")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("store_id", storeId)
    .eq("provider", "checkoutleak_connector")
    .maybeSingle()

  if (existingIntegration.error) {
    return { ok: false as const }
  }

  for (const row of connectorRows) {
    if (row.store_id === storeId) {
      continue
    }

    const metadata = asRecord(row.metadata)
    await input.admin
      .from("store_integrations")
      .update({
        metadata: {
          ...metadata,
          is_primary_source: false,
          source_role: "previous_url",
        } as Json,
      })
      .eq("id", row.id)
  }

  const previousPrimaryStoreIds = connectorRows
    .filter((row) => row.store_id !== storeId && isPrimaryUrlSourceMetadata(row.metadata))
    .map((row) => row.store_id)

  if (previousPrimaryStoreIds.length > 0) {
    await input.admin
      .from("stores")
      .update({ active: false })
      .eq("organization_id", input.organizationId)
      .eq("platform", "website")
      .in("id", previousPrimaryStoreIds)
  }

  let integrationId: string
  if (existingIntegration.data) {
    const updateIntegration = await input.admin
      .from("store_integrations")
      .update({
        status: "connected",
        sync_status: "synced",
        connection_health: "healthy",
        metadata: integrationMetadata as Json,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", existingIntegration.data.id)
      .select("id")
      .single()
    if (updateIntegration.error || !updateIntegration.data) {
      return { ok: false as const }
    }
    integrationId = updateIntegration.data.id
  } else {
    const insertIntegration = await input.admin
      .from("store_integrations")
      .insert({
        organization_id: input.organizationId,
        store_id: storeId,
        provider: "checkoutleak_connector",
        status: "connected",
        installed_at: new Date().toISOString(),
        sync_status: "synced",
        connection_health: "healthy",
        metadata: integrationMetadata as Json,
        last_synced_at: new Date().toISOString(),
      })
      .select("id")
      .single()
    if (insertIntegration.error || !insertIntegration.data) {
      return { ok: false as const }
    }
    integrationId = insertIntegration.data.id
  }

  return {
    ok: true as const,
    storeId,
    integrationId,
  }
}

async function createMonitoredUrlSource(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  organizationId: string
  normalizedUrl: string
  normalizedDomain: string
}) {
  const [usage, entitlements] = await Promise.all([
    getSourceUsageForOrganization(input.organizationId),
    getEntitlementsForOrganization(input.organizationId),
  ])
  if (!entitlements.isActive) {
    return { ok: false as const, reason: "plan_required" as const }
  }
  if (usage.isAtLimit) {
    return { ok: false as const, reason: "source_limit_reached" as const }
  }

  const existingStore = await input.admin
    .from("stores")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("platform", "website")
    .eq("domain", input.normalizedDomain)
    .eq("active", true)
    .maybeSingle()

  if (existingStore.error) {
    return { ok: false as const, reason: "source_create_failed" as const }
  }

  if (existingStore.data) {
    return {
      ok: true as const,
      storeId: existingStore.data.id,
      existing: true,
    }
  }

  const storeResult = await input.admin
    .from("stores")
    .insert({
      organization_id: input.organizationId,
      name: `${input.normalizedDomain} Source`,
      platform: "website",
      domain: input.normalizedDomain,
      timezone: "UTC",
      currency: "USD",
      active: true,
    })
    .select("id")
    .single()

  if (storeResult.error || !storeResult.data) {
    return { ok: false as const, reason: "source_create_failed" as const }
  }

  const metadata = {
    source_entity_type: "website_domain",
    live_source_url: input.normalizedUrl,
    live_source_domain: input.normalizedDomain,
    primary_live_source_url: input.normalizedUrl,
    primary_live_source_domain: input.normalizedDomain,
    primary_live_source_updated_at: new Date().toISOString(),
    is_primary_source: false,
    source_role: "monitored_url",
    connected_systems: ["checkoutleak_connector"],
  }

  const integrationResult = await input.admin
    .from("store_integrations")
    .insert({
      organization_id: input.organizationId,
      store_id: storeResult.data.id,
      provider: "checkoutleak_connector",
      status: "connected",
      installed_at: new Date().toISOString(),
      sync_status: "synced",
      connection_health: "healthy",
      metadata: metadata as Json,
      last_synced_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (integrationResult.error || !integrationResult.data) {
    return { ok: false as const, reason: "source_create_failed" as const }
  }

  return {
    ok: true as const,
    storeId: storeResult.data.id,
    existing: false,
  }
}

async function getPrimaryUrlSourceIntegration(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  organizationId: string
}) {
  const result = await input.admin
    .from("store_integrations")
    .select("id, store_id, metadata, installed_at, created_at")
    .eq("organization_id", input.organizationId)
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })

  if (result.error) {
    return { error: result.error, data: null }
  }

  const rows = result.data ?? []
  return {
    error: null,
    data:
      rows.find((row) => isPrimaryUrlSourceMetadata(row.metadata)) ??
      rows[0] ??
      null,
  }
}

async function queueUrlSourceScan(input: {
  admin: ReturnType<typeof createSupabaseAdminClient>
  organizationId: string
  storeId: string
  recipientEmail: string | null
}) {
  const entitlements = await getEntitlementsForOrganization(input.organizationId)
  if (!entitlements.isActive || !entitlements.canRunManualScan) {
    return { ok: false as const, reason: "plan_required" as const }
  }

  const scanInsert = await input.admin
    .from("scans")
    .insert({
      organization_id: input.organizationId,
      store_id: input.storeId,
      status: "queued",
      scanned_at: new Date().toISOString(),
      detected_issues_count: 0,
      estimated_monthly_leakage: 0,
      notification_requested: true,
      notification_reason: "manual_url_source_analysis",
      notification_recipient_email: input.recipientEmail,
    })
    .select("id")
    .single()

  if (scanInsert.error || !scanInsert.data) {
    return { ok: false as const, reason: "queue_failed" as const }
  }

  const triggerResult = await triggerQueuedScanTask({
    scanId: scanInsert.data.id,
    organizationId: input.organizationId,
    storeId: input.storeId,
    provider: "checkoutleak_connector",
  })

  if (!triggerResult.ok) {
    return { ok: false as const, reason: triggerResult.reason }
  }

  return { ok: true as const, scanId: scanInsert.data.id }
}

export async function setLiveSourceContext(formData: FormData) {
  const raw = (formData.get("source_url") as string | null)?.trim() ?? ""
  const normalized = normalizeLiveSourceUrl(raw)

  if (!normalized) {
    redirect("/app/stores?provider=source_url&status=invalid_source_url")
  }

  const session = await getServerSession()
  if (!session) {
    redirect("/auth/sign-in?next=/app/stores")
  }

  const cookieStore = await cookies()
  cookieStore.set(
    LIVE_SOURCE_CONTEXT_COOKIE,
    serializeLiveSourceContext({
      url: normalized.normalizedUrl,
      domain: normalized.hostname,
      updatedAt: new Date().toISOString(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  )

  const admin = createSupabaseAdminClient()
  const membershipResult = await admin
    .from("org_members")
    .select("organization_id")
    .eq("user_id", session.user.id)
    .single()

  if (membershipResult.error || !membershipResult.data) {
    redirect("/app/stores?provider=source_url&status=context_save_failed")
  }

  const entitlements = await getEntitlementsForOrganization(
    membershipResult.data.organization_id
  )
  if (!entitlements.isActive) {
    redirect("/app/billing?intent=plan_required")
  }

  const integrationsResult = await admin
    .from("store_integrations")
    .select("id, metadata, provider")
    .eq("organization_id", membershipResult.data.organization_id)
    .in("provider", ["shopify", "stripe"])
    .neq("status", "disconnected")

  if (integrationsResult.error) {
    redirect("/app/stores?provider=source_url&status=context_save_failed")
  }

  for (const integration of integrationsResult.data ?? []) {
    const metadata = asRecord(integration.metadata)
    const update = await admin
      .from("store_integrations")
      .update({
        metadata: {
          ...metadata,
          primary_live_source_url: normalized.normalizedUrl,
          primary_live_source_domain: normalized.hostname,
          primary_live_source_updated_at: new Date().toISOString(),
        } as Json,
      })
      .eq("id", integration.id)

    if (update.error) {
      redirect("/app/stores?provider=source_url&status=context_save_failed")
    }
  }

  const upsertPrimarySourceLane = await upsertPrimaryUrlSourceLane({
    admin,
    organizationId: membershipResult.data.organization_id,
    normalizedUrl: normalized.normalizedUrl,
    normalizedDomain: normalized.hostname,
    connectedSystemProviders: (integrationsResult.data ?? []).map(
      (integration) => integration.provider
    ),
  })

  if (!upsertPrimarySourceLane.ok) {
    redirect("/app/stores?provider=source_url&status=context_save_failed")
  }

  const queuedScan = await queueUrlSourceScan({
    admin,
    organizationId: membershipResult.data.organization_id,
    storeId: upsertPrimarySourceLane.storeId,
    recipientEmail: session.user.email,
  })

  if (!queuedScan.ok) {
    redirect(
      `/app/stores/${upsertPrimarySourceLane.storeId}?scan_status=${encodeURIComponent(queuedScan.reason)}#surface-analysis`
    )
  }

  revalidatePath("/app/connect")
  revalidatePath("/app/stores")
  revalidatePath(`/app/stores/${upsertPrimarySourceLane.storeId}`)

  redirect(
    `/app/stores/${upsertPrimarySourceLane.storeId}?scan_status=queued#surface-analysis`
  )
}

export async function addMonitoredSource(formData: FormData) {
  const raw = (formData.get("monitored_source_url") as string | null)?.trim() ?? ""
  const normalized = normalizeLiveSourceUrl(raw)

  if (!normalized) {
    redirect("/app/stores?provider=source_url&status=invalid_source_url#monitored-sources")
  }

  const session = await getServerSession()
  if (!session) {
    redirect("/auth/sign-in?next=/app/stores")
  }

  const admin = createSupabaseAdminClient()
  const membershipResult = await admin
    .from("org_members")
    .select("organization_id")
    .eq("user_id", session.user.id)
    .single()

  if (membershipResult.error || !membershipResult.data) {
    redirect("/app/stores?provider=source_url&status=context_save_failed#monitored-sources")
  }

  const created = await createMonitoredUrlSource({
    admin,
    organizationId: membershipResult.data.organization_id,
    normalizedUrl: normalized.normalizedUrl,
    normalizedDomain: normalized.hostname,
  })

  if (!created.ok) {
    redirect(`/app/stores?provider=source_url&status=${created.reason}#monitored-sources`)
  }

  const queuedScan = await queueUrlSourceScan({
    admin,
    organizationId: membershipResult.data.organization_id,
    storeId: created.storeId,
    recipientEmail: session.user.email,
  })

  revalidatePath("/app/stores")
  revalidatePath(`/app/stores/${created.storeId}`)

  if (!queuedScan.ok) {
    redirect(
      `/app/stores/${created.storeId}?scan_status=${encodeURIComponent(queuedScan.reason)}#surface-analysis`
    )
  }

  redirect(`/app/stores/${created.storeId}?scan_status=queued#surface-analysis`)
}

export async function triggerPrimaryUrlSourceAnalysis() {
  const session = await getServerSession()
  if (!session) {
    redirect("/auth/sign-in?next=/app/stores")
  }

  const admin = createSupabaseAdminClient()
  const membershipResult = await admin
    .from("org_members")
    .select("organization_id")
    .eq("user_id", session.user.id)
    .single()

  if (membershipResult.error || !membershipResult.data) {
    redirect("/app/stores?provider=source_url_analysis&status=unauthorized")
  }

  const entitlements = await getEntitlementsForOrganization(
    membershipResult.data.organization_id
  )
  if (!entitlements.isActive || !entitlements.canRunManualScan) {
    redirect("/app/billing?intent=plan_required")
  }

  const integrationResult = await getPrimaryUrlSourceIntegration({
    admin,
    organizationId: membershipResult.data.organization_id,
  })

  if (integrationResult.error || !integrationResult.data) {
    redirect("/app/stores?provider=source_url_analysis&status=source_not_set")
  }

  const storeId = integrationResult.data.store_id
  const metadata = asRecord(integrationResult.data.metadata)
  const entryUrl =
    (typeof metadata.primary_live_source_url === "string"
      ? metadata.primary_live_source_url
      : null) ??
    (typeof metadata.live_source_url === "string" ? metadata.live_source_url : null)

  if (!entryUrl) {
    redirect("/app/stores?provider=source_url_analysis&status=source_not_set")
  }

  const scanInsert = await admin
    .from("scans")
    .insert({
      organization_id: membershipResult.data.organization_id,
      store_id: storeId,
      status: "queued",
      scanned_at: new Date().toISOString(),
      detected_issues_count: 0,
      estimated_monthly_leakage: 0,
      notification_requested: true,
      notification_reason: "manual_url_source_analysis",
      notification_recipient_email: session.user.email,
    })
    .select("id")
    .single()

  if (scanInsert.error || !scanInsert.data) {
    redirect(`/app/stores/${storeId}?scan_status=queue_failed`)
  }

  const triggerResult = await triggerQueuedScanTask({
    scanId: scanInsert.data.id,
    organizationId: membershipResult.data.organization_id,
    storeId,
    provider: "checkoutleak_connector",
  })

  revalidatePath("/app/stores")
  revalidatePath(`/app/stores/${storeId}`)

  if (triggerResult.ok) {
    redirect(`/app/stores/${storeId}?scan_status=queued#surface-analysis`)
  }

  redirect(
    `/app/stores/${storeId}?scan_status=${encodeURIComponent(triggerResult.reason)}`
  )
}
