import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import {
  getSourceEntitlementsForOrganization,
  type SourceEntitlements,
} from "@/server/services/source-entitlement-service"
import { triggerQueuedScanTask } from "@/server/services/scan-task-service"
import { resolveStoreSourceVerification } from "@/server/services/source-verification-service"

const SCHEDULED_MONITORING_REASON = "scheduled_website_monitoring"

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  return input as Record<string, unknown>
}

function readPrimaryUrl(metadata: unknown) {
  const record = asRecord(metadata)
  if (!record) {
    return null
  }

  const primary = record.primary_live_source_url
  if (typeof primary === "string" && primary.trim()) {
    return primary.trim()
  }

  const legacy = record.live_source_url
  if (typeof legacy === "string" && legacy.trim()) {
    return legacy.trim()
  }

  return null
}

function isScheduledSource(metadata: unknown) {
  const record = asRecord(metadata)
  if (!record) return false
  if (record.source_role === "previous_url") return false
  return (
    record.source_role === "primary_url" ||
    record.source_role === "monitored_url" ||
    record.is_primary_source === true ||
    record.source_role === undefined
  )
}

function isValidHttpUrl(input: string) {
  try {
    const parsed = new URL(input)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

interface ScheduledMonitoringResult {
  considered: number
  eligible: number
  due: number
  queued: number
  triggered: number
  skipped_not_due: number
  skipped_plan_inactive: number
  skipped_plan_limit: number
  skipped_already_running: number
  skipped_unverified: number
  skipped: Array<{ storeId: string | null; reason: string }>
  failed: Array<{ storeId: string | null; reason: string }>
}

function isDueForScheduledMonitoring(input: {
  latestScheduledScanAt: string | null
  entitlement: SourceEntitlements
  now: Date
}) {
  if (!input.latestScheduledScanAt) {
    return true
  }

  const latestScanTime = new Date(input.latestScheduledScanAt).getTime()
  if (!Number.isFinite(latestScanTime)) {
    return true
  }

  const elapsedMs = input.now.getTime() - latestScanTime
  return elapsedMs >= input.entitlement.intervalHours * 60 * 60 * 1000
}

export async function queueScheduledWebsiteMonitoringScans(): Promise<ScheduledMonitoringResult> {
  const admin = createSupabaseAdminClient()
  const now = new Date()
  const entitlementByOrg = new Map<string, SourceEntitlements>()
  const eligibleSourceCountByOrg = new Map<string, number>()
  const result: ScheduledMonitoringResult = {
    considered: 0,
    eligible: 0,
    due: 0,
    queued: 0,
    triggered: 0,
    skipped_not_due: 0,
    skipped_plan_inactive: 0,
    skipped_plan_limit: 0,
    skipped_already_running: 0,
    skipped_unverified: 0,
    skipped: [],
    failed: [],
  }

  const integrationsResult = await admin
    .from("store_integrations")
    .select("id, organization_id, store_id, provider, status, metadata, created_at")
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")
    .order("organization_id", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  if (integrationsResult.error) {
    result.failed.push({
      storeId: null,
      reason: integrationsResult.error.message,
    })
    return result
  }

  for (const integration of integrationsResult.data ?? []) {
    result.considered += 1

    if (!isScheduledSource(integration.metadata)) {
      result.skipped.push({
        storeId: integration.store_id,
        reason: "source_not_monitored",
      })
      continue
    }

    const storeResult = await admin
      .from("stores")
      .select("id, organization_id, platform, active")
      .eq("id", integration.store_id)
      .eq("organization_id", integration.organization_id)
      .maybeSingle()

    if (storeResult.error || !storeResult.data) {
      result.failed.push({
        storeId: integration.store_id,
        reason: storeResult.error?.message ?? "store_missing",
      })
      continue
    }

    if (storeResult.data.platform !== "website" || !storeResult.data.active) {
      result.skipped.push({
        storeId: integration.store_id,
        reason: "source_not_active_website",
      })
      continue
    }

    const primaryUrl = readPrimaryUrl(integration.metadata)
    if (!primaryUrl || !isValidHttpUrl(primaryUrl)) {
      result.skipped.push({
        storeId: integration.store_id,
        reason: "primary_url_missing_or_invalid",
      })
      continue
    }

    const sourceVerification = await resolveStoreSourceVerification({
      admin,
      organizationId: integration.organization_id,
      storeId: integration.store_id,
      includeOrganizationOperators: true,
    })

    if (sourceVerification.state !== "verified") {
      result.skipped_unverified += 1
      result.skipped.push({
        storeId: integration.store_id,
        reason: "source_ownership_unverified",
      })
      continue
    }

    let entitlement = entitlementByOrg.get(integration.organization_id)
    if (!entitlement) {
      try {
        entitlement = await getSourceEntitlementsForOrganization(
          integration.organization_id
        )
        entitlementByOrg.set(integration.organization_id, entitlement)
      } catch (error) {
        result.failed.push({
          storeId: integration.store_id,
          reason: error instanceof Error ? error.message : "entitlement_lookup_failed",
        })
        continue
      }
    }

    if (!entitlement.isActive || !entitlement.canUseScheduledMonitoring) {
      result.skipped_plan_inactive += 1
      result.skipped.push({
        storeId: integration.store_id,
        reason: "scheduled_monitoring_not_included",
      })
      continue
    }

    const eligibleSourceCount =
      (eligibleSourceCountByOrg.get(integration.organization_id) ?? 0) + 1
    eligibleSourceCountByOrg.set(integration.organization_id, eligibleSourceCount)

    if (
      entitlement.maxSources !== null &&
      eligibleSourceCount > entitlement.maxSources
    ) {
      result.skipped_plan_limit += 1
      result.skipped.push({
        storeId: integration.store_id,
        reason: "plan_source_limit",
      })
      continue
    }

    result.eligible += 1

    const activeScanResult = await admin
      .from("scans")
      .select("id")
      .eq("organization_id", integration.organization_id)
      .eq("store_id", integration.store_id)
      .in("status", ["queued", "running"])
      .limit(1)
      .maybeSingle()

    if (activeScanResult.error) {
      result.failed.push({
        storeId: integration.store_id,
        reason: activeScanResult.error.message,
      })
      continue
    }

    if (activeScanResult.data) {
      result.skipped_already_running += 1
      result.skipped.push({
        storeId: integration.store_id,
        reason: "scan_already_active",
      })
      continue
    }

    const latestScheduledScanResult = await admin
      .from("scans")
      .select("scanned_at")
      .eq("organization_id", integration.organization_id)
      .eq("store_id", integration.store_id)
      .eq("notification_reason", SCHEDULED_MONITORING_REASON)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestScheduledScanResult.error) {
      result.failed.push({
        storeId: integration.store_id,
        reason: latestScheduledScanResult.error.message,
      })
      continue
    }

    const due = isDueForScheduledMonitoring({
      latestScheduledScanAt: latestScheduledScanResult.data?.scanned_at ?? null,
      entitlement,
      now,
    })

    if (!due) {
      result.skipped_not_due += 1
      result.skipped.push({
        storeId: integration.store_id,
        reason: "not_due",
      })
      continue
    }

    result.due += 1

    const scanInsert = await admin
      .from("scans")
      .insert({
        organization_id: integration.organization_id,
        store_id: integration.store_id,
        status: "queued",
        scanned_at: now.toISOString(),
        detected_issues_count: 0,
        estimated_monthly_leakage: 0,
        notification_requested: true,
        notification_reason: SCHEDULED_MONITORING_REASON,
        notification_status: null,
        notification_recipient_email: null,
      })
      .select("id")
      .single()

    if (scanInsert.error || !scanInsert.data) {
      result.failed.push({
        storeId: integration.store_id,
        reason: scanInsert.error?.message ?? "scan_insert_failed",
      })
      continue
    }

    result.queued += 1

    const triggerResult = await triggerQueuedScanTask({
      scanId: scanInsert.data.id,
      organizationId: integration.organization_id,
      storeId: integration.store_id,
      provider: "checkoutleak_connector",
    })

    if (triggerResult.ok) {
      result.triggered += 1
    } else {
      result.failed.push({
        storeId: integration.store_id,
        reason: triggerResult.reason,
      })
    }
  }

  return result
}
