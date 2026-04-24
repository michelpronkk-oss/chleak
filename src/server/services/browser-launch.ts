"use server"

import { chromium } from "playwright-core"

// Shared Chromium launcher used by all browser-based runners.
//
// In production (Vercel / Lambda): uses @sparticuz/chromium to resolve the
// serverless-compatible binary path and recommended args.
//
// In local development: respects CHROMIUM_EXECUTABLE_PATH if set, otherwise
// lets playwright-core find a locally installed browser. If no local browser
// is found, the launch will throw -- callers wrap this in try/catch and
// degrade to "skipped" status.

function isServerlessEnv() {
  // Vercel Functions and AWS Lambda need the @sparticuz/chromium binary.
  // Trigger.dev workers are real Node processes with a browser installed via
  // the playwright build extension, so they do NOT need @sparticuz/chromium.
  const isTriggerDev = Boolean(
    process.env.TRIGGER_PROJECT_ID ||
    process.env.TRIGGER_API_URL
  )
  if (isTriggerDev) return false
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  )
}

export async function launchChromiumBrowser() {
  const serverless = isServerlessEnv()
  const localOverride = process.env.CHROMIUM_EXECUTABLE_PATH

  let executablePath: string | undefined = localOverride || undefined
  let extraArgs: string[] = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ]

  if (serverless && !localOverride) {
    try {
      const sparticuz = await import("@sparticuz/chromium")
      executablePath = await sparticuz.default.executablePath()
      extraArgs = [...sparticuz.default.args, ...extraArgs]
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`@sparticuz/chromium failed to resolve executable: ${msg}`)
    }
  }

  return chromium.launch({
    executablePath,
    args: extraArgs,
    headless: true,
  })
}
