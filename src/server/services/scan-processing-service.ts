import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import type { Database, Json } from "@/types/database"

type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"]

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

function asString(input: unknown) {
  return typeof input === "string" ? input : null
}

function asNumber(input: unknown) {
  return typeof input === "number" && Number.isFinite(input) ? input : null
}

function asBoolean(input: unknown) {
  return typeof input === "boolean" ? input : null
}

interface ShopifySignalSnapshot {
  orders30d: number | null
  totalOrders: number | null
  products: number | null
  customers: number | null
}

interface FindingDraft {
  key: string
  type: "setup_gap"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  summary: string
  whyItMatters: string
  recommendedAction: string
  estimatedMonthlyRevenueImpact: number
}

function readShopifySignalSnapshot(metadata: Record<string, unknown>): ShopifySignalSnapshot {
  const raw = asRecord(metadata.signal_snapshot)
  return {
    orders30d: asNumber(raw?.orders_30d),
    totalOrders: asNumber(raw?.total_orders),
    products: asNumber(raw?.products),
    customers: asNumber(raw?.customers),
  }
}

function hasMeaningfulCommercialSignal(snapshot: ShopifySignalSnapshot) {
  return (snapshot.orders30d ?? 0) >= 5 || (snapshot.totalOrders ?? 0) >= 25
}

function hasWebhookFailure(metadata: Record<string, unknown>, integrationStatus: string, syncStatus: string | null) {
  const lastError = asString(metadata.last_error)?.toLowerCase() ?? ""
  return (
    integrationStatus === "degraded" ||
    syncStatus === "errored" ||
    asBoolean(metadata.webhook_registration_failed) === true ||
    lastError.includes("webhook registration failed")
  )
}

function buildShopifyFindings(input: {
  metadata: Record<string, unknown>
  integrationStatus: string
  syncStatus: string | null
  scopes: string[] | null
  meaningfulCommercialSignal: boolean
}) {
  const findings: FindingDraft[] = []
  const webhookFailure = hasWebhookFailure(
    input.metadata,
    input.integrationStatus,
    input.syncStatus
  )

  if (webhookFailure) {
    findings.push({
      key: "shopify_webhook_registration_incomplete",
      type: "setup_gap",
      severity: "high",
      title: "Webhook registration incomplete",
      summary:
        "Shopify event delivery is not fully confirmed, so CheckoutLeak cannot guarantee reliable leakage signal intake.",
      whyItMatters:
        "Missing webhook continuity lowers confidence in leakage detection and can delay issue surfacing.",
      recommendedAction:
        "Open the Shopify connection settings and retry webhook setup to restore full event coverage.",
      estimatedMonthlyRevenueImpact: 0,
    })
  }

  const requiredScopes = ["read_orders", "read_checkouts"]
  const granted = new Set((input.scopes ?? []).map((scope) => scope.trim().toLowerCase()))
  const missingScopes = requiredScopes.filter((scope) => !granted.has(scope))

  if (missingScopes.length > 0 && input.meaningfulCommercialSignal) {
    findings.push({
      key: "shopify_monitoring_coverage_incomplete",
      type: "setup_gap",
      severity: "high",
      title: "Monitoring coverage incomplete",
      summary:
        "Commercial activity is present, but required Shopify data scopes are missing for full leakage analysis.",
      whyItMatters:
        "When key read scopes are missing, high-value checkout leakage can remain undetected.",
      recommendedAction:
        `Reconnect Shopify and approve full monitoring scopes: ${missingScopes.join(", ")}.`,
      estimatedMonthlyRevenueImpact: 0,
    })
  }

  return findings
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
      .select("id, provider, status, sync_status, connection_health, scopes, shop_domain, metadata")
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

  const detectedAt = new Date().toISOString()
  const integrationMetadata = asRecord(integrationResult.data.metadata) ?? {}
  const signalSnapshot = readShopifySignalSnapshot(integrationMetadata)
  const meaningfulCommercialSignal = hasMeaningfulCommercialSignal(signalSnapshot)
  const findings =
    integrationResult.data.provider === "shopify"
      ? buildShopifyFindings({
          metadata: integrationMetadata,
          integrationStatus: integrationResult.data.status,
          syncStatus: integrationResult.data.sync_status,
          scopes: integrationResult.data.scopes,
          meaningfulCommercialSignal,
        })
      : []

  const managedIssueSource = "shopify_monitoring_v1"
  if (integrationResult.data.provider === "shopify") {
    const resolveOldIssues = await admin
      .from("issues")
      .update({ status: "resolved" })
      .eq("organization_id", queuedScan.organization_id)
      .eq("store_id", queuedScan.store_id)
      .eq("source", managedIssueSource)
      .neq("status", "resolved")

    if (resolveOldIssues.error) {
      console.error(
        `[scan-runner] issue resolution cleanup failed: scan_id=${queuedScan.id}; reason=${resolveOldIssues.error.message}`
      )
    }
  }

  let insertedFindings = 0
  if (findings.length > 0) {
    const issueRows: IssueInsert[] = findings.map((finding) => ({
      organization_id: queuedScan.organization_id,
      store_id: queuedScan.store_id,
      scan_id: queuedScan.id,
      title: finding.title,
      summary: finding.summary,
      type: finding.type,
      severity: finding.severity,
      status: "open",
      estimated_monthly_revenue_impact: finding.estimatedMonthlyRevenueImpact,
      recommended_action: finding.recommendedAction,
      source: managedIssueSource,
      detected_at: detectedAt,
      why_it_matters: finding.whyItMatters,
    }))

    const issuesInsert = await admin.from("issues").insert(issueRows).select("id")
    if (issuesInsert.error) {
      console.error(
        `[scan-runner] findings insert failed: scan_id=${queuedScan.id}; reason=${issuesInsert.error.message}`
      )
    } else {
      insertedFindings = issuesInsert.data?.length ?? 0
    }
  }

  const completedAt = new Date().toISOString()
  const completionPayload = {
    status: "completed",
    completed_at: completedAt,
    detected_issues_count: insertedFindings,
    estimated_monthly_leakage: findings.reduce(
      (total, finding) => total + finding.estimatedMonthlyRevenueImpact,
      0
    ),
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
      : meaningfulCommercialSignal
        ? "clean"
        : "no_signal"

  const metadata = asRecord(integrationResult.data.metadata) ?? {}
  const metadataUpdate = {
    ...metadata,
    scan_outcome: outcome,
    scan_outcome_updated_at: new Date().toISOString(),
    meaningful_signal_detected: meaningfulCommercialSignal,
    finding_keys: findings.map((finding) => finding.key),
  }

  const integrationUpdate = await admin
    .from("store_integrations")
    .update({
      metadata: metadataUpdate as Json,
      sync_status: integrationResult.data.status === "degraded" ? "errored" : "synced",
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", integrationResult.data.id)

  if (integrationUpdate.error) {
    console.error(
      `[scan-runner] outcome metadata update failed: scan_id=${queuedScan.id}; integration_id=${integrationResult.data.id}; reason=${integrationUpdate.error.message}`
    )
  }

  console.info(
    `[scan-runner] outcome classified: scan_id=${queuedScan.id}; outcome=${outcome}; completed_count=${completedCount}; meaningful_signal=${meaningfulCommercialSignal}; findings=${insertedFindings}`
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
