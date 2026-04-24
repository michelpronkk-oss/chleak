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
  const sourceStoreInsert = {
    organization_id: input.organizationId,
    name: `${input.normalizedDomain} Source`,
    platform: "website",
    domain: input.normalizedDomain,
    timezone: "UTC",
    currency: "USD",
    active: true,
  }

  const storeResult = await input.admin
    .from("stores")
    .upsert([sourceStoreInsert], { onConflict: "organization_id,platform,domain" })
    .select("id")
    .single()

  if (storeResult.error || !storeResult.data) {
    return { ok: false as const }
  }

  const integrationInsert = {
    organization_id: input.organizationId,
    store_id: storeResult.data.id,
    provider: "checkoutleak_connector",
    status: "connected",
    installed_at: new Date().toISOString(),
    sync_status: "synced",
    connection_health: "healthy",
    metadata: {
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
    } as Json,
    last_synced_at: new Date().toISOString(),
  }

  const integrationResult = await input.admin
    .from("store_integrations")
    .upsert([integrationInsert], { onConflict: "organization_id,store_id,provider" })
    .select("id")
    .single()

  if (integrationResult.error || !integrationResult.data) {
    return { ok: false as const }
  }

  return {
    ok: true as const,
    storeId: storeResult.data.id,
    integrationId: integrationResult.data.id,
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
    })
    .select("id")
    .single()

  if (scanInsert.error || !scanInsert.data) {
    redirect(`/app/stores/${storeId}?scan_status=queue_failed`)
  }

  const { processQueuedScanV1 } = await import(
    "@/server/services/scan-processing-service"
  )
  const processed = await processQueuedScanV1({ scanId: scanInsert.data.id })

  revalidatePath("/app/stores")
  revalidatePath(`/app/stores/${storeId}`)

  if (processed.processed) {
    redirect(`/app/stores/${storeId}?scan_status=completed#surface-analysis`)
  }

  redirect(
    `/app/stores/${storeId}?scan_status=${encodeURIComponent(processed.reason)}`
  )
}
