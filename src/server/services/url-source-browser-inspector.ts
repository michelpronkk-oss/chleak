import { createHash } from "node:crypto"
import { mkdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"

import { type Page } from "playwright-core"

import { launchChromiumBrowser } from "./browser-launch"

export const URL_SOURCE_BROWSER_INSPECTOR_DETECTOR_VERSION =
  "url_source_browser_inspector_v1"

const MOBILE_VIEWPORT = { width: 375, height: 812 }
const DESKTOP_VIEWPORT = { width: 1280, height: 800 }
const NAV_TIMEOUT_MS = 20_000
const SETTLE_WAIT_MS = 1_500

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type CoreWebVitalRating = "good" | "needs_improvement" | "poor"

export interface UrlSourceBrowserInspectionResultV1 {
  detectorVersion: string
  status: "completed" | "failed" | "skipped"
  entryUrl: string
  finalUrl: string | null
  loadTimeMs: number | null
  pageTitle: string | null
  hasH1: boolean
  h1Text: string | null
  // Mobile-specific H1 rendering
  mobileH1FontSizePx: number | null
  mobileH1IsOversized: boolean
  formCount: number
  mobileHasAboveFoldCta: boolean
  mobileAboveFoldCtaLabels: string[]
  mobileViewportOverflow: boolean
  mobileScreenshotRef: string | null
  mobileScreenshotSha256: string | null
  mobileScreenshotBytes: number | null
  desktopHasAboveFoldCta: boolean
  desktopAboveFoldCtaLabels: string[]
  desktopScreenshotRef: string | null
  desktopScreenshotSha256: string | null
  desktopScreenshotBytes: number | null
  // Rendered body text sample for copy quality analysis
  mobileVisibleText: string
  visibleLinks: Array<{ href: string; label: string }>
  // Core Web Vitals (desktop pass — measured inside real Chromium)
  lcpMs: number | null
  lcpRating: CoreWebVitalRating | null
  clsScore: number | null
  clsRating: CoreWebVitalRating | null
  domElementCount: number | null
  errorMessage: string | null
}

// ---------------------------------------------------------------------------
// DOM evaluation — runs inside the browser context
// ---------------------------------------------------------------------------

interface DomMetrics {
  title: string
  h1Text: string | null
  hasH1: boolean
  h1FontSizePx: number | null
  h1IsOversized: boolean
  formCount: number
  viewportOverflow: boolean
  aboveFoldCtaLabels: string[]
  visibleLinks: Array<{ href: string; label: string }>
  visibleBodyText: string
  loadTimeMs: number | null
}

async function evaluateDom(
  page: Page,
  viewportHeight: number
): Promise<DomMetrics> {
  try {
    return await page.evaluate((vh: number): DomMetrics => {
      const title = document.title?.trim() ?? ""
      const h1 = document.querySelector("h1")
      const h1Text = h1?.textContent?.trim() ?? null
      const hasH1 = Boolean(h1)

      // Measure the rendered H1 font size. On mobile viewports this reveals
      // whether the heading is too large and pushing content below the fold.
      let h1FontSizePx: number | null = null
      let h1IsOversized = false
      if (h1) {
        try {
          const computed = window.getComputedStyle(h1)
          const parsed = parseFloat(computed.fontSize)
          if (!isNaN(parsed)) {
            h1FontSizePx = parsed
            // > 52px on a 375px viewport typically causes multi-line overflow
            // that pushes the primary CTA below the fold
            h1IsOversized = parsed > 52
          }
        } catch {}
      }

      const formCount = document.querySelectorAll("form").length

      const scrollWidth = document.documentElement.scrollWidth
      const clientWidth = document.documentElement.clientWidth
      const viewportOverflow = scrollWidth > clientWidth + 4

      const interactiveEls = Array.from(
        document.querySelectorAll<HTMLElement>("a, button, [role='button']")
      )
      const aboveFoldCtaLabels = interactiveEls
        .filter((el) => {
          const rect = el.getBoundingClientRect()
          return (
            rect.top >= 0 &&
            rect.top < vh &&
            rect.width > 0 &&
            rect.height > 0 &&
            rect.width < 500
          )
        })
        .map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 1 && t.length < 80)
        .slice(0, 20)

      const visibleLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
        .map((el) => ({
          href: el.href || el.getAttribute("href") || "",
          label: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        }))
        .filter((link) => link.href && link.label.length > 0 && link.label.length < 100)
        .slice(0, 120)

      // Capture a compact sample of visible body text for copy quality checks
      const visibleBodyText = (document.body?.innerText ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000)

      let loadTimeMs: number | null = null
      try {
        const timing = performance.timing
        if (timing && timing.domContentLoadedEventEnd > 0 && timing.navigationStart > 0) {
          loadTimeMs = timing.domContentLoadedEventEnd - timing.navigationStart
        }
      } catch {}

      return {
        title,
        h1Text,
        hasH1,
        h1FontSizePx,
        h1IsOversized,
        formCount,
        viewportOverflow,
        aboveFoldCtaLabels,
        visibleLinks,
        visibleBodyText,
        loadTimeMs,
      }
    }, viewportHeight)
  } catch {
    return {
      title: "",
      h1Text: null,
      hasH1: false,
      h1FontSizePx: null,
      h1IsOversized: false,
      formCount: 0,
      viewportOverflow: false,
      aboveFoldCtaLabels: [],
      visibleLinks: [],
      visibleBodyText: "",
      loadTimeMs: null,
    }
  }
}

// ---------------------------------------------------------------------------
// Core Web Vitals helpers
// ---------------------------------------------------------------------------

function rateLcp(ms: number): CoreWebVitalRating {
  if (ms <= 2500) return "good"
  if (ms <= 4000) return "needs_improvement"
  return "poor"
}

function rateCls(score: number): CoreWebVitalRating {
  if (score <= 0.1) return "good"
  if (score <= 0.25) return "needs_improvement"
  return "poor"
}

async function measureCoreWebVitals(page: Page): Promise<{
  lcpMs: number | null
  clsScore: number | null
  domElementCount: number | null
}> {
  try {
    return await page.evaluate((): Promise<{
      lcpMs: number | null
      clsScore: number | null
      domElementCount: number | null
    }> => {
      return new Promise((resolve) => {
        let lcpMs: number | null = null
        let clsScore = 0

        try {
          const lcpObs = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            if (entries.length > 0) {
              lcpMs = entries[entries.length - 1]?.startTime ?? null
            }
          })
          lcpObs.observe({ type: "largest-contentful-paint", buffered: true })
        } catch {}

        try {
          const clsObs = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number }
              if (!shift.hadRecentInput) {
                clsScore += shift.value ?? 0
              }
            }
          })
          clsObs.observe({ type: "layout-shift", buffered: true })
        } catch {}

        const domElementCount = document.querySelectorAll("*").length

        // Give observers 2 seconds to collect buffered entries
        setTimeout(() => {
          resolve({
            lcpMs,
            clsScore: Math.round(clsScore * 1000) / 1000,
            domElementCount,
          })
        }, 2000)
      })
    })
  } catch {
    return { lcpMs: null, clsScore: null, domElementCount: null }
  }
}

// ---------------------------------------------------------------------------
// Screenshot helper — mirrors the activation runner's pattern
// ---------------------------------------------------------------------------

interface ScreenshotCapture {
  reference: string
  sha256: string
  bytes: number
}

async function captureScreenshot(input: {
  page: Page
  runId: string
  label: string
}): Promise<ScreenshotCapture | null> {
  const baseDir = process.env.NODE_ENV === "production"
    ? path.join("/tmp", "evidence", "url-source-browser-runs")
    : path.join(process.cwd(), "public", "evidence", "url-source-browser-runs")

  try {
    await mkdir(baseDir, { recursive: true })
    const safeId = input.runId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 40)
    const fileName = `${safeId}-${Date.now()}-${input.label}.png`
    const absolutePath = path.join(baseDir, fileName)
    const buffer = await input.page.screenshot({ type: "png", timeout: 8_000 })
    await writeFile(absolutePath, buffer)
    const sha256 = createHash("sha256").update(buffer).digest("hex")
    const fileStat = await stat(absolutePath).catch(() => null)
    const publicRoot = path.join(process.cwd(), "public")
    const reference = absolutePath.startsWith(publicRoot)
      ? absolutePath.slice(publicRoot.length).replaceAll("\\", "/").replace(/^\/?/, "/")
      : absolutePath
    return { reference, sha256, bytes: fileStat?.size ?? buffer.byteLength }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runUrlSourceBrowserInspectionV1(input: {
  runId: string
  entryUrl: string
}): Promise<UrlSourceBrowserInspectionResultV1> {
  const failed = (message: string): UrlSourceBrowserInspectionResultV1 => ({
    detectorVersion: URL_SOURCE_BROWSER_INSPECTOR_DETECTOR_VERSION,
    status: "failed",
    entryUrl: input.entryUrl,
    finalUrl: null,
    loadTimeMs: null,
    pageTitle: null,
    hasH1: false,
    h1Text: null,
    mobileH1FontSizePx: null,
    mobileH1IsOversized: false,
    formCount: 0,
    mobileHasAboveFoldCta: false,
    mobileAboveFoldCtaLabels: [],
    mobileViewportOverflow: false,
    mobileVisibleText: "",
    mobileScreenshotRef: null,
    mobileScreenshotSha256: null,
    mobileScreenshotBytes: null,
    desktopHasAboveFoldCta: false,
    desktopAboveFoldCtaLabels: [],
    desktopScreenshotRef: null,
    desktopScreenshotSha256: null,
    desktopScreenshotBytes: null,
    visibleLinks: [],
    lcpMs: null,
    lcpRating: null,
    clsScore: null,
    clsRating: null,
    domElementCount: null,
    errorMessage: message,
  })

  let browser: Awaited<ReturnType<typeof launchChromiumBrowser>> | null = null

  try {
    try {
      browser = await launchChromiumBrowser()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ...failed(message), status: "skipped" }
    }

    // --- Mobile pass ---
    let finalUrl: string | null = null
    let mobileMetrics: DomMetrics | null = null
    let mobileScreenshot: ScreenshotCapture | null = null

    try {
      const mobileCtx = await browser.newContext({
        viewport: MOBILE_VIEWPORT,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
      })
      const mobilePage = await mobileCtx.newPage()
      await mobilePage.goto(input.entryUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAV_TIMEOUT_MS,
      })
      await mobilePage.waitForTimeout(SETTLE_WAIT_MS)
      finalUrl = mobilePage.url()
      mobileMetrics = await evaluateDom(mobilePage, MOBILE_VIEWPORT.height)
      mobileScreenshot = await captureScreenshot({
        page: mobilePage,
        runId: input.runId,
        label: "mobile",
      })
      await mobileCtx.close()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[browser-inspector] mobile pass failed: ${message}`)
    }

    // --- Desktop pass ---
    let desktopMetrics: DomMetrics | null = null
    let desktopScreenshot: ScreenshotCapture | null = null
    let cwvMetrics: Awaited<ReturnType<typeof measureCoreWebVitals>> | null = null

    try {
      const desktopCtx = await browser.newContext({ viewport: DESKTOP_VIEWPORT })
      const desktopPage = await desktopCtx.newPage()
      await desktopPage.goto(finalUrl ?? input.entryUrl, {
        waitUntil: "domcontentloaded",
        timeout: NAV_TIMEOUT_MS,
      })
      await desktopPage.waitForTimeout(SETTLE_WAIT_MS)
      if (!finalUrl) finalUrl = desktopPage.url()
      desktopMetrics = await evaluateDom(desktopPage, DESKTOP_VIEWPORT.height)
      cwvMetrics = await measureCoreWebVitals(desktopPage)
      desktopScreenshot = await captureScreenshot({
        page: desktopPage,
        runId: input.runId,
        label: "desktop",
      })
      await desktopCtx.close()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[browser-inspector] desktop pass failed: ${message}`)
    }

    if (!mobileMetrics && !desktopMetrics) {
      return failed("Both mobile and desktop passes failed to load the page.")
    }

    // Prefer mobile metrics for content quality (more conservative)
    const content = mobileMetrics ?? desktopMetrics!

    return {
      detectorVersion: URL_SOURCE_BROWSER_INSPECTOR_DETECTOR_VERSION,
      status: "completed",
      entryUrl: input.entryUrl,
      finalUrl: finalUrl ?? null,
      loadTimeMs: content.loadTimeMs,
      pageTitle: content.title || null,
      hasH1: content.hasH1,
      h1Text: content.h1Text,
      mobileH1FontSizePx: mobileMetrics?.h1FontSizePx ?? null,
      mobileH1IsOversized: mobileMetrics?.h1IsOversized ?? false,
      formCount: content.formCount,
      mobileHasAboveFoldCta: (mobileMetrics?.aboveFoldCtaLabels.length ?? 0) > 0,
      mobileAboveFoldCtaLabels: mobileMetrics?.aboveFoldCtaLabels ?? [],
      mobileViewportOverflow: mobileMetrics?.viewportOverflow ?? false,
      mobileScreenshotRef: mobileScreenshot?.reference ?? null,
      mobileScreenshotSha256: mobileScreenshot?.sha256 ?? null,
      mobileScreenshotBytes: mobileScreenshot?.bytes ?? null,
      desktopHasAboveFoldCta: (desktopMetrics?.aboveFoldCtaLabels.length ?? 0) > 0,
      desktopAboveFoldCtaLabels: desktopMetrics?.aboveFoldCtaLabels ?? [],
      desktopScreenshotRef: desktopScreenshot?.reference ?? null,
      desktopScreenshotSha256: desktopScreenshot?.sha256 ?? null,
      desktopScreenshotBytes: desktopScreenshot?.bytes ?? null,
      mobileVisibleText: mobileMetrics?.visibleBodyText ?? "",
      visibleLinks: mobileMetrics?.visibleLinks ?? desktopMetrics?.visibleLinks ?? [],
      lcpMs: cwvMetrics?.lcpMs ?? null,
      lcpRating: cwvMetrics?.lcpMs !== null && cwvMetrics?.lcpMs !== undefined ? rateLcp(cwvMetrics.lcpMs) : null,
      clsScore: cwvMetrics?.clsScore ?? null,
      clsRating: cwvMetrics?.clsScore !== null && cwvMetrics?.clsScore !== undefined ? rateCls(cwvMetrics.clsScore) : null,
      domElementCount: cwvMetrics?.domElementCount ?? null,
      errorMessage: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return failed(message)
  } finally {
    if (browser) {
      await browser.close().catch(() => {})
    }
  }
}
