import { logger, task } from "@trigger.dev/sdk/v3"

import { processQueuedScanV1 } from "@/server/services/scan-processing-service"

export interface StripeBillingScanPayload {
  scanId: string
  organizationId: string
  storeId: string
}

// Runs Stripe billing recovery analysis for a queued scan.
// The shared processor owns scan state transitions, findings, and evidence.
export const stripeBillingScanTask = task({
  id: "stripe-billing-scan",
  maxDuration: 120,
  run: async (payload: StripeBillingScanPayload) => {
    logger.info("Stripe billing scan started", {
      scanId: payload.scanId,
      storeId: payload.storeId,
      organizationId: payload.organizationId,
    })

    const result = await processQueuedScanV1({ scanId: payload.scanId })

    if (!result.processed) {
      logger.warn("Stripe billing scan did not process", {
        scanId: payload.scanId,
        reason: result.reason,
      })
    } else {
      logger.info("Stripe billing scan completed", {
        scanId: payload.scanId,
        outcome: result.outcome,
        detectedIssues: result.detectedIssuesCount,
        estimatedLeakage: result.estimatedMonthlyLeakage,
      })
    }

    return result
  },
})
