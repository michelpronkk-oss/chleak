import { logger, task } from "@trigger.dev/sdk/v3"

import { processQueuedScanV1 } from "@/server/services/scan-processing-service"

export interface UrlSourceScanPayload {
  scanId: string
  organizationId: string
  storeId: string
}

// Runs URL surface analysis + Playwright browser inspection for a queued scan.
// Called after a scan record has been inserted with status "queued".
// Handles both the HTML-based runner and the full browser inspection pass.
export const urlSourceScanTask = task({
  id: "url-source-scan",
  maxDuration: 120, // 2 minutes -- HTML fetch + Playwright mobile + desktop
  run: async (payload: UrlSourceScanPayload) => {
    logger.info("URL source scan started", {
      scanId: payload.scanId,
      storeId: payload.storeId,
      organizationId: payload.organizationId,
    })

    const result = await processQueuedScanV1({ scanId: payload.scanId })

    if (!result.processed) {
      logger.warn("URL source scan did not process", {
        scanId: payload.scanId,
        reason: result.reason,
      })
    } else {
      logger.info("URL source scan completed", {
        scanId: payload.scanId,
        outcome: result.outcome,
        detectedIssues: result.detectedIssuesCount,
        businessType: result.integrationProvider,
      })
    }

    return result
  },
})
