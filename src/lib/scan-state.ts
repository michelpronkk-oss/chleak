// Shared scan state helpers used on the sources page, source detail, and overview.

export type ScanStateLabel =
  | "queued"
  | "queued_stale"
  | "running"
  | "running_stale"
  | "completed"
  | "failed"
  | "none"

export interface NormalizedScanState {
  state: ScanStateLabel
  label: string
  tone: "muted" | "primary" | "warning" | "success" | "danger"
  isPending: boolean
  isStale: boolean
  message: string
  nextAction: "wait" | "retry" | "review" | "none"
}

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
      return "Scan did not start. Retry analysis when ready."
    case "running":
      return "Analysis running. Browser inspection and revenue path checks are in progress."
    case "running_stale":
      return "Scan is taking longer than expected. Retry analysis if this persists."
    case "completed":
      return "Analysis complete."
    case "failed":
      return "Scan failed. Retry to run a fresh analysis."
    default:
      return ""
  }
}

export function normalizeScanState(scan: {
  status: string
  scannedAt: string | null
  completedAt?: string | null
  errorMessage?: string | null
  detectedIssuesCount?: number | null
} | null): NormalizedScanState {
  const state = classifyScanState(scan)

  if (state === "queued") {
    return {
      state,
      label: "Analysis queued",
      tone: "primary",
      isPending: true,
      isStale: false,
      message: getScanStateMessage(state),
      nextAction: "wait",
    }
  }
  if (state === "queued_stale") {
    return {
      state,
      label: "Scan did not start",
      tone: "warning",
      isPending: false,
      isStale: true,
      message: getScanStateMessage(state),
      nextAction: "retry",
    }
  }
  if (state === "running") {
    return {
      state,
      label: "Analysis running",
      tone: "primary",
      isPending: true,
      isStale: false,
      message: getScanStateMessage(state),
      nextAction: "wait",
    }
  }
  if (state === "running_stale") {
    return {
      state,
      label: "Scan is taking longer than expected",
      tone: "warning",
      isPending: false,
      isStale: true,
      message: getScanStateMessage(state),
      nextAction: "retry",
    }
  }
  if (state === "failed") {
    return {
      state,
      label: "Analysis failed",
      tone: "danger",
      isPending: false,
      isStale: false,
      message: scan?.errorMessage
        ? `Analysis failed. ${scan.errorMessage}`
        : getScanStateMessage(state),
      nextAction: "retry",
    }
  }
  if (state === "completed") {
    const count = scan?.detectedIssuesCount ?? 0
    return {
      state,
      label: "Analysis completed",
      tone: count > 0 ? "warning" : "success",
      isPending: false,
      isStale: false,
      message: count > 0 ? `Analysis completed with ${count} finding${count === 1 ? "" : "s"}.` : "Analysis completed.",
      nextAction: "review",
    }
  }

  return {
    state,
    label: "No analysis yet",
    tone: "muted",
    isPending: false,
    isStale: false,
    message: "",
    nextAction: "none",
  }
}

export function scanStateIsActive(state: ScanStateLabel): boolean {
  return state === "queued" || state === "running"
}

export function scanStateIsStale(state: ScanStateLabel): boolean {
  return state === "queued_stale" || state === "running_stale"
}
