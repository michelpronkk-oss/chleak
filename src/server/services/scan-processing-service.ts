import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { Json } from "@/types/database"

export type ScanProcessResult = {
  processed: boolean
  reason: string
  scanId: string | null
  outcome?: "no_signal" | "clean" | "issues_found" | null
  organizationId?: string | null
  storeId?: string | null
  storePlatform?: string | null
  integrationProvider?: string | null
  status?: string | null
  completedAt?: string | null
  detectedIssuesCount?: number | null
  estimatedMonthlyLeakage?: number | null
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  return input as Record<string, unknown>
}

export async function processQueuedScanV1(input?: { scanId?: string | null }): Promise<ScanProcessResult> {
  const admin = createSupabaseAdminClient()
  const queuedScanResult = input?.scanId
    ? await admin
        .from("scans")
        .select("id, organization_id, store_id, status, created_at")
        .eq("id", input.scanId)
        .eq("status", "queued")
        .maybeSingle()
    : await admin
        .from("scans")
        .select("id, organization_id, store_id, status, created_at")
        .eq("status", "queued")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()

  if (queuedScanResult.error) {
    console.error(
      `[scan-runner] queued scan lookup failed: ${queuedScanResult.error.message}`
    )
    return {
      processed: false,
      reason: "lookup_failed",
      scanId: input?.scanId ?? null,
    }
  }

  const queuedScan = queuedScanResult.data
  if (!queuedScan) {
    return {
      processed: false,
      reason: input?.scanId ? "scan_not_queued_or_missing" : "no_queued_scan",
      scanId: input?.scanId ?? null,
    }
  }

  console.info(
    `[scan-runner] queued scan picked: scan_id=${queuedScan.id}; organization=${queuedScan.organization_id}; store_id=${queuedScan.store_id}`
  )

  const [storeResult, integrationResult] = await Promise.all([
    admin
      .from("stores")
      .select("id, organization_id, platform, domain, name, active")
      .eq("id", queuedScan.store_id)
      .eq("organization_id", queuedScan.organization_id)
      .maybeSingle(),
    admin
      .from("store_integrations")
      .select("id, provider, status, sync_status, shop_domain, metadata")
      .eq("organization_id", queuedScan.organization_id)
      .eq("store_id", queuedScan.store_id)
      .neq("status", "disconnected")
      .order("installed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (storeResult.error || !storeResult.data) {
    const reason = storeResult.error?.message ?? "store_not_found"
    console.error(
      `[scan-runner] store load failed: scan_id=${queuedScan.id}; reason=${reason}`
    )
    return {
      processed: false,
      reason: "store_missing",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  if (integrationResult.error || !integrationResult.data) {
    const reason = integrationResult.error?.message ?? "integration_not_found"
    console.error(
      `[scan-runner] integration load failed: scan_id=${queuedScan.id}; reason=${reason}`
    )
    return {
      processed: false,
      reason: "integration_missing",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  const runningAt = new Date().toISOString()
  const runningResult = await admin
    .from("scans")
    .update({
      status: "running",
      scanned_at: runningAt,
    })
    .eq("id", queuedScan.id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle()

  if (runningResult.error) {
    console.error(
      `[scan-runner] running update failed: scan_id=${queuedScan.id}; reason=${runningResult.error.message}`
    )
    return {
      processed: false,
      reason: "running_update_failed",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  if (!runningResult.data) {
    return {
      processed: false,
      reason: "scan_not_queued_anymore",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  console.info(
    `[scan-runner] running state set: scan_id=${queuedScan.id}; at=${runningAt}`
  )

  const completedAt = new Date().toISOString()
  const completionPayload = {
    status: "completed",
    completed_at: completedAt,
    detected_issues_count: 0,
    estimated_monthly_leakage: 0,
  } as const

  const completionResult = await admin
    .from("scans")
    .update(completionPayload)
    .eq("id", queuedScan.id)
    .select("id, status, completed_at, detected_issues_count, estimated_monthly_leakage")
    .maybeSingle()

  if (completionResult.error || !completionResult.data) {
    const reason = completionResult.error?.message ?? "scan_not_found_on_complete"
    console.error(
      `[scan-runner] completion failed: scan_id=${queuedScan.id}; reason=${reason}`
    )
    await admin.from("scans").update({ status: "failed" }).eq("id", queuedScan.id)
    return {
      processed: false,
      reason: "completion_failed",
      scanId: queuedScan.id,
      outcome: null,
      organizationId: queuedScan.organization_id,
      storeId: queuedScan.store_id,
    }
  }

  const completedCountResult = await admin
    .from("scans")
    .select("id", { head: true, count: "exact" })
    .eq("organization_id", queuedScan.organization_id)
    .eq("store_id", queuedScan.store_id)
    .eq("status", "completed")

  const completedCount = completedCountResult.count ?? 0
  const outcome =
    completionResult.data.detected_issues_count > 0 ||
    completionResult.data.estimated_monthly_leakage > 0
      ? "issues_found"
      : completedCount <= 1
        ? "no_signal"
        : "clean"

  const metadata = asRecord(integrationResult.data.metadata) ?? {}
  const metadataUpdate = {
    ...metadata,
    scan_outcome: outcome,
    scan_outcome_updated_at: new Date().toISOString(),
  }

  const integrationUpdate = await admin
    .from("store_integrations")
    .update({ metadata: metadataUpdate as Json })
    .eq("id", integrationResult.data.id)

  if (integrationUpdate.error) {
    console.error(
      `[scan-runner] outcome metadata update failed: scan_id=${queuedScan.id}; integration_id=${integrationResult.data.id}; reason=${integrationUpdate.error.message}`
    )
  }

  console.info(
    `[scan-runner] outcome classified: scan_id=${queuedScan.id}; outcome=${outcome}; completed_count=${completedCount}`
  )

  console.info(
    `[scan-runner] completion state set: scan_id=${queuedScan.id}; payload=${JSON.stringify(completionPayload)}`
  )

  return {
    processed: true,
    reason: "processed",
    scanId: queuedScan.id,
    outcome,
    organizationId: queuedScan.organization_id,
    storeId: queuedScan.store_id,
    storePlatform: storeResult.data.platform,
    integrationProvider: integrationResult.data.provider,
    status: completionResult.data.status,
    completedAt: completionResult.data.completed_at,
    detectedIssuesCount: completionResult.data.detected_issues_count,
    estimatedMonthlyLeakage: completionResult.data.estimated_monthly_leakage,
  }
}
