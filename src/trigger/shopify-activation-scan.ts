import { logger, task } from "@trigger.dev/sdk/v3"

import { processQueuedScanV1 } from "@/server/services/scan-processing-service"

export interface ShopifyActivationScanPayload {
  scanId: string
  organizationId: string
  storeId: string
}

// Runs Shopify activation flow analysis for a queued scan.
// Uses the Playwright activation flow runner to navigate the store and
// detect dead ends, stalled progressions, and first-value gaps.
export const shopifyActivationScanTask = task({
  id: "shopify-activation-scan",
  maxDuration: 180, // 3 minutes -- Playwright navigation can be slow on real stores
  run: async (payload: ShopifyActivationScanPayload) => {
    logger.info("Shopify activation scan started", {
      scanId: payload.scanId,
      storeId: payload.storeId,
      organizationId: payload.organizationId,
    })

    const result = await processQueuedScanV1({ scanId: payload.scanId })

    if (!result.processed) {
      logger.warn("Shopify activation scan did not process", {
        scanId: payload.scanId,
        reason: result.reason,
      })
    } else {
      logger.info("Shopify activation scan completed", {
        scanId: payload.scanId,
        outcome: result.outcome,
        detectedIssues: result.detectedIssuesCount,
        estimatedLeakage: result.estimatedMonthlyLeakage,
      })
    }

    return result
  },
})
