import { NextResponse } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import {
  processQueuedScanV1,
  type ScanSimulationOutcome,
} from "@/server/services/scan-processing-service"

function isAuthorized(request: Request) {
  const configuredKey =
    process.env.INTERNAL_SCAN_SIM_KEY ?? process.env.INTERNAL_SCAN_PROCESS_KEY

  if (!configuredKey || configuredKey.trim().length === 0) {
    return process.env.NODE_ENV !== "production"
  }

  const providedKey =
    request.headers.get("x-checkoutleak-sim-key") ??
    request.headers.get("x-checkoutleak-manual-key") ??
    new URL(request.url).searchParams.get("key")

  return providedKey === configuredKey
}

function parseOutcome(input: unknown): ScanSimulationOutcome | null {
  if (
    input === "no_signal" ||
    input === "clean" ||
    input === "findings_present"
  ) {
    return input
  }

  return null
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    outcome?: unknown
    organizationId?: unknown
    storeId?: unknown
  }
  const outcome = parseOutcome(body.outcome)
  const organizationId =
    typeof body.organizationId === "string" && body.organizationId.trim().length > 0
      ? body.organizationId.trim()
      : null
  const storeId =
    typeof body.storeId === "string" && body.storeId.trim().length > 0
      ? body.storeId.trim()
      : null

  if (!outcome) {
    return NextResponse.json(
      { message: "Invalid outcome. Use no_signal, clean, or findings_present." },
      { status: 400 }
    )
  }

  const admin = createSupabaseAdminClient()

  let targetStoreId = storeId
  let targetOrganizationId = organizationId

  if (!targetStoreId) {
    if (!targetOrganizationId) {
      return NextResponse.json(
        { message: "organizationId is required when storeId is not provided." },
        { status: 400 }
      )
    }

    const integrationLookup = await admin
      .from("store_integrations")
      .select("store_id")
      .eq("organization_id", targetOrganizationId)
      .eq("provider", "shopify")
      .neq("status", "disconnected")
      .order("installed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (integrationLookup.error || !integrationLookup.data?.store_id) {
      return NextResponse.json(
        { message: "No active Shopify integration found for organization." },
        { status: 404 }
      )
    }

    targetStoreId = integrationLookup.data.store_id
  }

  if (!targetOrganizationId) {
    const storeLookup = await admin
      .from("stores")
      .select("organization_id")
      .eq("id", targetStoreId)
      .maybeSingle()

    if (storeLookup.error || !storeLookup.data?.organization_id) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 })
    }

    targetOrganizationId = storeLookup.data.organization_id
  }

  const insertScan = await admin
    .from("scans")
    .insert({
      organization_id: targetOrganizationId,
      store_id: targetStoreId,
      status: "queued",
      scanned_at: new Date().toISOString(),
      detected_issues_count: 0,
      estimated_monthly_leakage: 0,
    })
    .select("id")
    .single()

  if (insertScan.error || !insertScan.data) {
    return NextResponse.json(
      { message: "Failed to create simulation scan.", error: insertScan.error?.message },
      { status: 500 }
    )
  }

  console.info(
    `[scan-sim] simulation requested: outcome=${outcome}; organization=${targetOrganizationId}; store_id=${targetStoreId}; scan_id=${insertScan.data.id}`
  )

  const result = await processQueuedScanV1({
    scanId: insertScan.data.id,
    simulationOutcome: outcome,
  })

  return NextResponse.json(
    {
      simulation: {
        outcome,
        organizationId: targetOrganizationId,
        storeId: targetStoreId,
      },
      result,
    },
    { status: result.processed ? 200 : 500 }
  )
}

