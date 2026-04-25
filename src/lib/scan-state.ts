// Shared scan state helpers used on the sources page, source detail, and overview.

export type ScanStateLabel =
  | "queued"
  | "queued_stale"
  | "running"
  | "running_stale"
  | "completed"
  | "failed"
  | "none"

const QUEUED_STALE_MINUTES = 2
const RUNNING_STALE_MINUTES = 10

export function classifyScanState(scan: {
  status: string
  scannedAt: string | null
} | null): ScanStateLabel {
  if (!scan) return "none"

  const ageMinutes = scan.scannedAt
    ? (Date.now() - new Date(scan.scannedAt).getTime()) / 60_000
    : 0

  if (scan.status === "queued") {
    return ageMinutes > QUEUED_STALE_MINUTES ? "queued_stale" : "queued"
  }
  if (scan.status === "running") {
    return ageMinutes > RUNNING_STALE_MINUTES ? "running_stale" : "running"
  }
  if (scan.status === "completed") return "completed"
  if (scan.status === "failed") return "failed"
  return "none"
}

export function getScanStateMessage(state: ScanStateLabel): string {
  switch (state) {
    case "queued":
      return "Analysis queued. SilentLeak is preparing the scan."
    case "queued_stale":
      return "Scan has not started yet. The background worker may be unavailable. Retry or check your Trigger.dev setup."
    case "running":
      return "Analysis running. Browser inspection and revenue path checks are in progress."
    case "running_stale":
      return "Scan is taking longer than expected. Results will appear when complete, or retry if this persists."
    case "completed":
      return "Analysis complete."
    case "failed":
      return "Scan failed. Retry to run a fresh analysis."
    default:
      return ""
  }
}

export function scanStateIsActive(state: ScanStateLabel): boolean {
  return state === "queued" || state === "running"
}

export function scanStateIsStale(state: ScanStateLabel): boolean {
  return state === "queued_stale" || state === "running_stale"
}
