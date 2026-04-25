import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { getEntitlementsForOrganization } from "@/server/services/entitlement-service"

type AdminClient = ReturnType<typeof createSupabaseAdminClient>

export interface SourceEntitlements {
  planKey: "starter" | "growth" | "pro" | "unknown"
  isActive: boolean
  canUseScheduledMonitoring: boolean
  maxSources: number | null
  intervalHours: number
  cadenceLabel: string
  sourceLimitLabel: string
}

export interface ActiveMonitoredSource {
  storeId: string
  organizationId: string
  name: string
  domain: string | null
  createdAt: string
  integrationId: string
  sourceRole: "primary_url" | "monitored_url" | "legacy_url"
  isPrimary: boolean
  metadata: unknown
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {}
  }
  return input as Record<string, unknown>
}

function getSourceRole(metadata: unknown): ActiveMonitoredSource["sourceRole"] {
  const record = asRecord(metadata)
  if (record.source_role === "primary_url") return "primary_url"
  if (record.source_role === "monitored_url") return "monitored_url"
  return "legacy_url"
}

function isCountableSource(metadata: unknown) {
  const record = asRecord(metadata)
  if (record.source_role === "previous_url") return false
  return (
    record.source_role === "primary_url" ||
    record.source_role === "monitored_url" ||
    record.is_primary_source === true ||
    record.source_role === undefined
  )
}

function formatCadence(intervalHours: number) {
  if (intervalHours <= 6) return "high-frequency monitoring"
  if (intervalHours <= 24) return "daily monitoring"
  return "weekly monitoring"
}

export async function getSourceEntitlementsForOrganization(
  organizationId: string
): Promise<SourceEntitlements> {
  const entitlement = await getEntitlementsForOrganization(organizationId)
  const planKey = entitlement.planKey
  const maxSources = entitlement.maxSources ?? null
  const sourceLimitLabel =
    maxSources === null
      ? "Unlimited sources"
      : `${maxSources} monitored source${maxSources === 1 ? "" : "s"}`

  return {
    planKey,
    isActive: entitlement.isActive,
    canUseScheduledMonitoring: entitlement.canUseScheduledMonitoring,
    maxSources,
    intervalHours: entitlement.monitoringIntervalHours,
    cadenceLabel: formatCadence(entitlement.monitoringIntervalHours),
    sourceLimitLabel,
  }
}

export async function getActiveMonitoredSourcesForOrganization(input: {
  admin?: AdminClient
  organizationId: string
}): Promise<ActiveMonitoredSource[]> {
  const admin = input.admin ?? createSupabaseAdminClient()
  const result = await admin
    .from("store_integrations")
    .select("id, organization_id, store_id, metadata, stores!inner(id, organization_id, name, domain, platform, active, created_at)")
    .eq("organization_id", input.organizationId)
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .eq("stores.platform", "website")
    .eq("stores.active", true)

  if (result.error) {
    return []
  }

  const rows = (result.data ?? []) as Array<{
    id: string
    organization_id: string
    store_id: string
    metadata: unknown
    stores:
      | {
          id: string
          organization_id: string
          name: string
          domain: string | null
          platform: string
          active: boolean
          created_at: string
        }
      | Array<{
          id: string
          organization_id: string
          name: string
          domain: string | null
          platform: string
          active: boolean
          created_at: string
        }>
      | null
  }>

  return rows
    .filter((row) => isCountableSource(row.metadata))
    .map((row) => {
      const store = Array.isArray(row.stores) ? row.stores[0] : row.stores
      const role = getSourceRole(row.metadata)
      return {
        storeId: row.store_id,
        organizationId: row.organization_id,
        name: store?.name ?? "Website source",
        domain: store?.domain ?? null,
        createdAt: store?.created_at ?? "",
        integrationId: row.id,
        sourceRole: role,
        isPrimary: role === "primary_url" || asRecord(row.metadata).is_primary_source === true,
        metadata: row.metadata,
      }
    })
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1
      return left.createdAt.localeCompare(right.createdAt)
    })
}

export async function getSourceUsageForOrganization(organizationId: string) {
  const [entitlements, sources] = await Promise.all([
    getSourceEntitlementsForOrganization(organizationId),
    getActiveMonitoredSourcesForOrganization({ organizationId }),
  ])
  const usedSources = sources.length
  const remainingSources =
    entitlements.maxSources === null
      ? null
      : Math.max(entitlements.maxSources - usedSources, 0)

  return {
    ...entitlements,
    sources,
    usedSources,
    remainingSources,
    isAtLimit:
      entitlements.maxSources !== null && usedSources >= entitlements.maxSources,
  }
}
