import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { Database, Json } from "@/types/database"

type StoreInsert = Database["public"]["Tables"]["stores"]["Insert"]
type StoreUpdate = Database["public"]["Tables"]["stores"]["Update"]
type StoreIntegrationInsert =
  Database["public"]["Tables"]["store_integrations"]["Insert"]
type ScanInsert = Database["public"]["Tables"]["scans"]["Insert"]
type IntegrationWebhookEventInsert =
  Database["public"]["Tables"]["integration_webhook_events"]["Insert"]

function toJsonPayload(input: unknown): Json {
  try {
    return JSON.parse(JSON.stringify(input)) as Json
  } catch {
    return { raw: String(input) }
  }
}

async function ensureStripeStore(input: {
  organizationId: string
  name: string
}) {
  const supabase = createSupabaseAdminClient()
  const existing = await supabase
    .from("stores")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("platform", "stripe")
    .limit(1)
    .maybeSingle()

  if (existing.error) {
    throw new Error("Failed to load Stripe source.")
  }

  if (existing.data?.id) {
    const update: StoreUpdate = {
      name: input.name,
      active: true,
      timezone: "UTC",
      currency: "USD",
    }

    const updateResult = await supabase
      .from("stores")
      .update(update)
      .eq("id", existing.data.id)
      .select("id")
      .single()

    if (updateResult.error || !updateResult.data) {
      throw new Error("Failed to update Stripe source.")
    }

    return updateResult.data.id
  }

  const insert: StoreInsert = {
    organization_id: input.organizationId,
    name: input.name,
    platform: "stripe",
    domain: null,
    timezone: "UTC",
    currency: "USD",
    active: true,
  }

  const insertResult = await supabase
    .from("stores")
    .insert(insert)
    .select("id")
    .single()

  if (insertResult.error || !insertResult.data) {
    throw new Error("Failed to create Stripe source.")
  }

  return insertResult.data.id
}

export async function persistStripeIntegration(input: {
  organizationId: string
  stripeAccountId: string
  sourceName: string
  scope: string
  livemode: boolean
  accessToken: string
  refreshToken: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const storeId = await ensureStripeStore({
    organizationId: input.organizationId,
    name: input.sourceName,
  })

  const integrationInsert: StoreIntegrationInsert = {
    organization_id: input.organizationId,
    store_id: storeId,
    provider: "stripe",
    status: "connected",
    account_identifier: input.stripeAccountId,
    installed_at: new Date().toISOString(),
    sync_status: "syncing",
    connection_health: "healthy",
    access_token_ref: "stripe_v1_ref_placeholder",
    metadata: {
      connect_source: "oauth_callback",
      source_entity_type: "billing_account",
      live_source_url: null,
      live_source_domain: null,
      live_source_identifier: input.stripeAccountId,
      connected_systems: ["stripe"],
      scope: input.scope,
      livemode: input.livemode,
      has_refresh_token: Boolean(input.refreshToken),
    },
    last_synced_at: null,
  }

  const integrationResult = await supabase
    .from("store_integrations")
    .upsert([integrationInsert], { onConflict: "organization_id,store_id,provider" })
    .select("id")
    .single()

  if (integrationResult.error || !integrationResult.data) {
    throw new Error("Failed to persist Stripe integration.")
  }

  // Token handling should move to encrypted secret storage before production.
  // This placeholder documents where secure token references are persisted.
  void input.accessToken

  const scanInsert: ScanInsert = {
    organization_id: input.organizationId,
    store_id: storeId,
    status: "queued",
    scanned_at: new Date().toISOString(),
    detected_issues_count: 0,
    estimated_monthly_leakage: 0,
  }

  const scanResult = await supabase.from("scans").insert(scanInsert).select("id").single()
  if (scanResult.error) {
    console.error(
      `[stripe] scan insert failed: organization=${input.organizationId}; store_id=${storeId}; error=${scanResult.error.message}`
    )
  }

  return {
    storeId,
    integrationId: integrationResult.data.id,
    scanId: scanResult.error ? null : (scanResult.data?.id ?? null),
  }
}

export async function markStripeIntegrationErrored(input: {
  organizationId: string
  accountId: string | null
  reason: string
}) {
  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("store_integrations")
    .update({
      status: "degraded",
      sync_status: "errored",
      connection_health: "degraded",
      metadata: {
        last_error: input.reason,
      },
    })
    .eq("organization_id", input.organizationId)
    .eq("provider", "stripe")

  if (input.accountId) {
    query = query.eq("account_identifier", input.accountId)
  }

  const result = await query
  if (result.error) {
    throw new Error("Failed to mark Stripe integration as errored.")
  }
}

export async function logStripeWebhookEvent(input: {
  accountId: string | null
  topic: string
  payload: unknown
  organizationId?: string
}) {
  const supabase = createSupabaseAdminClient()
  const payloadRecord: IntegrationWebhookEventInsert = {
    organization_id: input.organizationId ?? null,
    provider: "stripe",
    source_domain: input.accountId,
    topic: input.topic,
    payload: toJsonPayload(input.payload),
  }

  const result = await supabase.from("integration_webhook_events").insert(payloadRecord)

  if (result.error) {
    throw new Error("Failed to log Stripe webhook event.")
  }

  return true
}
