import { logger, schedules } from "@trigger.dev/sdk/v3"

import { queueScheduledWebsiteMonitoringScans } from "@/server/services/scheduled-monitoring-service"

// Weekly website monitoring pass.
// Monday 09:00 UTC, easy to adjust as monitoring cadence becomes plan-aware.
export const websiteMonitoringSchedule = schedules.task({
  id: "website-monitoring-schedule",
  cron: {
    pattern: "0 9 * * 1",
    timezone: "UTC",
  },
  maxDuration: 300,
  run: async (payload) => {
    logger.info("Website monitoring schedule started", {
      timestamp: payload.timestamp,
      lastTimestamp: payload.lastTimestamp,
    })

    const result = await queueScheduledWebsiteMonitoringScans()

    logger.info("Website monitoring schedule completed", {
      considered: result.considered,
      queued: result.queued,
      triggered: result.triggered,
      skipped: result.skipped.length,
      failed: result.failed.length,
    })

    if (result.failed.length > 0) {
      logger.warn("Website monitoring schedule had source failures", {
        failed: result.failed,
      })
    }

    return result
  },
})
