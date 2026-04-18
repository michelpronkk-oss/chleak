import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { Database, Json } from "@/types/database"

type StoreInsert = Database["public"]["Tables"]["stores"]["Insert"]
type StoreIntegrationInsert =
  Database["public"]["Tables"]["store_integrations"]["Insert"]
type IntegrationWebhookEventInsert =
  Database["public"]["Tables"]["integration_webhook_events"]["Insert"]

function toJsonPayload(input: unknown): Json {
  try {
    return JSON.parse(JSON.stringify(input)) as Json
  } catch {
    return { raw: String(input) }
  }
}

export async function persistShopifyIntegration(input: {
  organizationId: string
  shopDomain: string
  shopName: string
  scopes: string[]
  accessToken: string
}) {
  const supabase = createSupabaseAdminClient()
  const storeInsert: StoreInsert = {
    organization_id: input.organizationId,
    name: input.shopName,
    platform: "shopify",
    domain: input.shopDomain,
    timezone: "UTC",
    currency: "USD",
    active: true,
  }

  // NOTE: onConflict:"organization_id" requires a unique constraint on stores.organization_id.
  // If that constraint does not exist the upsert will error with code 42P10 (no unique/exclusion constraint).
  // NOTE: using service-role admin client — RLS is bypassed.
  console.info(
    `[shopify] store upsert start: organization=${input.organizationId}; payload=${JSON.stringify(storeInsert)}`
  )

  const storeResult = await supabase
    .from("stores")
    .upsert([storeInsert], { onConflict: "organization_id" })
    .select("id")
    .single()

  if (storeResult.error || !storeResult.data) {
    console.error(
      `[shopify] store upsert failed: organization=${input.organizationId}; error=${JSON.stringify({ code: storeResult.error?.code, message: storeResult.error?.message, details: storeResult.error?.details, hint: storeResult.error?.hint })}`
    )
    throw new Error("Failed to persist Shopify store.")
  }

  console.info(
    `[shopify] store upsert success: organization=${input.organizationId}; store_id=${storeResult.data.id}`
  )

  const integrationInsert: StoreIntegrationInsert = {
    organization_id: input.organizationId,
    store_id: storeResult.data.id,
    provider: "shopify",
    status: "connected",
    shop_domain: input.shopDomain,
    scopes: input.scopes,
    installed_at: new Date().toISOString(),
    sync_status: "syncing",
    connection_health: "healthy",
    access_token_ref: "shopify_v1_ref_placeholder",
    metadata: {
      install_source: "oauth_callback",
    },
    last_synced_at: null,
  }

  // NOTE: onConflict:"organization_id,store_id,provider" requires a composite unique constraint on those three columns.
  console.info(
    `[shopify] integration upsert start: organization=${input.organizationId}; store_id=${storeResult.data.id}; payload=${JSON.stringify({ ...integrationInsert, scopes: integrationInsert.scopes })}`
  )

  const integrationResult = await supabase
    .from("store_integrations")
    .upsert([integrationInsert], { onConflict: "organization_id,store_id,provider" })
    .select("id")
    .single()

  if (integrationResult.error || !integrationResult.data) {
    console.error(
      `[shopify] integration upsert failed: organization=${input.organizationId}; store_id=${storeResult.data.id}; error=${JSON.stringify({ code: integrationResult.error?.code, message: integrationResult.error?.message, details: integrationResult.error?.details, hint: integrationResult.error?.hint })}`
    )
    throw new Error("Failed to persist Shopify integration.")
  }

  console.info(
    `[shopify] integration upsert success: organization=${input.organizationId}; integration_id=${integrationResult.data.id}`
  )

  // Token handling should move to encrypted secret storage before production.
  // This placeholder shows where a secure token reference would be persisted.
  void input.accessToken

  return {
    storeId: storeResult.data.id,
    integrationId: integrationResult.data.id,
  }
}

export async function markShopifyIntegrationErrored(input: {
  organizationId: string
  shopDomain: string
  reason: string
}) {
  const supabase = createSupabaseAdminClient()

  const result = await supabase
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
    .eq("provider", "shopify")
    .eq("shop_domain", input.shopDomain)

  if (result.error) {
    throw new Error("Failed to mark Shopify integration as errored.")
  }
}

export async function logShopifyWebhookEvent(input: {
  shopDomain: string
  topic: string
  payload: unknown
  organizationId?: string
}) {
  const supabase = createSupabaseAdminClient()
  const payloadRecord: IntegrationWebhookEventInsert = {
    organization_id: input.organizationId ?? null,
    provider: "shopify",
    source_domain: input.shopDomain,
    topic: input.topic,
    payload: toJsonPayload(input.payload),
  }

  const result = await supabase.from("integration_webhook_events").insert(payloadRecord)

  if (result.error) {
    throw new Error("Failed to log Shopify webhook event.")
  }

  return true
}
