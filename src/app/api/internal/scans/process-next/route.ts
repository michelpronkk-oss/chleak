import { NextResponse } from "next/server"

import { processQueuedScanV1 } from "@/server/services/scan-processing-service"

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

  const result = await processQueuedScanV1()
  const status =
    result.reason === "no_queued_scan"
      ? 200
      : result.reason === "store_missing" ||
          result.reason === "integration_missing" ||
          result.reason === "scan_not_queued_anymore" ||
          result.reason === "scan_not_queued_or_missing"
        ? 409
        : result.processed
          ? 200
          : 500

  return NextResponse.json(result, { status })
}
