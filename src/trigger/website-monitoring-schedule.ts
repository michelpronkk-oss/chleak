import { logger, schedules } from "@trigger.dev/sdk/v3"

import { queueScheduledWebsiteMonitoringScans } from "@/server/services/scheduled-monitoring-service"

// Hourly cadence gate. The service enforces plan-aware monitoring intervals.
export const websiteMonitoringSchedule = schedules.task({
  id: "website-monitoring-schedule",
  cron: {
    pattern: "0 * * * *",
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
      due: result.due,
      queued: result.queued,
      triggered: result.triggered,
      skipped_not_due: result.skipped_not_due,
      skipped_plan_limit: result.skipped_plan_limit,
      skipped_already_running: result.skipped_already_running,
      skipped_unverified: result.skipped_unverified,
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
