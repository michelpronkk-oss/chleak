import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { triggerQueuedScanTask } from "@/server/services/scan-task-service"

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
  queued: number
  triggered: number
  skipped: Array<{ storeId: string | null; reason: string }>
  failed: Array<{ storeId: string | null; reason: string }>
}

export async function queueScheduledWebsiteMonitoringScans(): Promise<ScheduledMonitoringResult> {
  const admin = createSupabaseAdminClient()
  const result: ScheduledMonitoringResult = {
    considered: 0,
    queued: 0,
    triggered: 0,
    skipped: [],
    failed: [],
  }

  const integrationsResult = await admin
    .from("store_integrations")
    .select("id, organization_id, store_id, provider, status, metadata")
    .eq("provider", "checkoutleak_connector")
    .neq("status", "disconnected")

  if (integrationsResult.error) {
    result.failed.push({
      storeId: null,
      reason: integrationsResult.error.message,
    })
    return result
  }

  for (const integration of integrationsResult.data ?? []) {
    result.considered += 1

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
      result.skipped.push({
        storeId: integration.store_id,
        reason: "scan_already_active",
      })
      continue
    }

    const scanInsert = await admin
      .from("scans")
      .insert({
        organization_id: integration.organization_id,
        store_id: integration.store_id,
        status: "queued",
        scanned_at: new Date().toISOString(),
        detected_issues_count: 0,
        estimated_monthly_leakage: 0,
        notification_requested: true,
        notification_reason: "scheduled_website_monitoring",
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
