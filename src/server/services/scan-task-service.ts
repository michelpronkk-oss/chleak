import { tasks } from "@trigger.dev/sdk/v3"

import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { sendScanCompletionNotification } from "@/server/services/scan-completion-notification-service"

type ScanTaskProvider = "checkoutleak_connector" | "shopify" | "stripe"

interface TriggerQueuedScanTaskInput {
  scanId: string
  organizationId: string
  storeId: string
  provider: string
}

function getScanTaskId(provider: string) {
  if (provider === "checkoutleak_connector") {
    return "url-source-scan"
  }
  if (provider === "stripe") {
    return "stripe-billing-scan"
  }
  return "shopify-activation-scan"
}

function isKnownScanTaskProvider(provider: string): provider is ScanTaskProvider {
  return (
    provider === "checkoutleak_connector" ||
    provider === "shopify" ||
    provider === "stripe"
  )
}

export async function triggerQueuedScanTask(input: TriggerQueuedScanTaskInput) {
  const taskId = getScanTaskId(input.provider)

  if (!isKnownScanTaskProvider(input.provider)) {
    console.error(
      `[scan-task] unsupported provider: scan_id=${input.scanId}; provider=${input.provider}`
    )
    return { ok: false as const, reason: "unsupported_provider", taskId }
  }

  try {
    const handle = await tasks.trigger(taskId, {
      scanId: input.scanId,
      organizationId: input.organizationId,
      storeId: input.storeId,
    })

    console.info(
      `[scan-task] trigger queued: scan_id=${input.scanId}; task_id=${taskId}; run_id=${handle.id}`
    )

    return { ok: true as const, taskId, runId: handle.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      `[scan-task] trigger failed: scan_id=${input.scanId}; task_id=${taskId}; reason=${message}`
    )

    const admin = createSupabaseAdminClient()
    await admin
      .from("scans")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", input.scanId)
      .eq("status", "queued")

    await sendScanCompletionNotification({
      scanId: input.scanId,
      organizationId: input.organizationId,
      storeId: input.storeId,
      outcome: null,
      status: "failed",
      detectedIssuesCount: 0,
      estimatedMonthlyLeakage: 0,
      scanFamily: null,
    })

    return { ok: false as const, reason: "trigger_failed", taskId }
  }
}
