import { NextResponse } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/shared"

function isAuthorized(request: Request) {
  const configuredKey =
    process.env.INTERNAL_SCAN_PROCESS_KEY ?? process.env.MANUAL_SCAN_PROCESS_KEY

  if (!configuredKey || configuredKey.trim().length === 0) {
    return process.env.NODE_ENV !== "production"
  }

  const providedKey =
    request.headers.get("x-checkoutleak-manual-key") ??
    new URL(request.url).searchParams.get("key")

  return providedKey === configuredKey
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const admin = createSupabaseAdminClient()
  const queuedScanResult = await admin
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
    return NextResponse.json(
      { processed: false, reason: "lookup_failed" },
      { status: 500 }
    )
  }

  const queuedScan = queuedScanResult.data
  if (!queuedScan) {
    return NextResponse.json({ processed: false, reason: "no_queued_scan" })
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
      .select("id, provider, status, sync_status, shop_domain")
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
    return NextResponse.json(
      { processed: false, reason: "store_missing" },
      { status: 409 }
    )
  }

  if (integrationResult.error || !integrationResult.data) {
    const reason = integrationResult.error?.message ?? "integration_not_found"
    console.error(
      `[scan-runner] integration load failed: scan_id=${queuedScan.id}; reason=${reason}`
    )
    return NextResponse.json(
      { processed: false, reason: "integration_missing" },
      { status: 409 }
    )
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
    return NextResponse.json(
      { processed: false, reason: "running_update_failed" },
      { status: 500 }
    )
  }

  if (!runningResult.data) {
    return NextResponse.json(
      { processed: false, reason: "scan_not_queued_anymore" },
      { status: 409 }
    )
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

    return NextResponse.json(
      { processed: false, reason: "completion_failed" },
      { status: 500 }
    )
  }

  console.info(
    `[scan-runner] completion state set: scan_id=${queuedScan.id}; payload=${JSON.stringify(completionPayload)}`
  )

  return NextResponse.json({
    processed: true,
    scanId: queuedScan.id,
    organizationId: queuedScan.organization_id,
    storeId: queuedScan.store_id,
    storePlatform: storeResult.data.platform,
    integrationProvider: integrationResult.data.provider,
    status: completionResult.data.status,
    completedAt: completionResult.data.completed_at,
    detectedIssuesCount: completionResult.data.detected_issues_count,
    estimatedMonthlyLeakage: completionResult.data.estimated_monthly_leakage,
  })
}
