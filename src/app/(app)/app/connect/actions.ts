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
import { triggerQueuedScanTask } from "@/server/services/scan-task-service"
import type { Json } from "@/types/database"

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {}
  }
  return input as Record<string, unknown>
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
    connected_systems: [
      "checkoutleak_connector",
      ...input.connectedSystemProviders.filter(
        (provider) => provider === "shopify" || provider === "stripe"
      ),
    ],
  }

  // Find or create the website store for this org and domain
  const existingStore = await input.admin
    .from("stores")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("platform", "website")
    .eq("domain", input.normalizedDomain)
    .maybeSingle()

  if (existingStore.error) {
    return { ok: false as const }
  }

  let storeId: string
  if (existingStore.data) {
    storeId = existingStore.data.id
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

  // Find or create the checkoutleak_connector integration for this store
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

  revalidatePath("/app/connect")
  revalidatePath("/app/stores")
  redirect("/app/stores?provider=source_url&status=context_saved")
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

  const integrationResult = await admin
    .from("store_integrations")
    .select("id, store_id, metadata")
    .eq("organization_id", membershipResult.data.organization_id)
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .order("installed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

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

  if (!triggerResult.ok) {
    redirect(
      `/app/stores/${storeId}?scan_status=${encodeURIComponent(triggerResult.reason)}&scan_id=${encodeURIComponent(scanInsert.data.id)}#surface-analysis`
    )
  }

  redirect(
    `/app/stores/${storeId}?scan_status=queued&scan_id=${encodeURIComponent(scanInsert.data.id)}#surface-analysis`
  )
}
