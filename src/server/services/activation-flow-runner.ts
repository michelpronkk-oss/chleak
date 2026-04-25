import { createHash } from "node:crypto"
import { mkdir } from "node:fs/promises"
import { stat } from "node:fs/promises"
import { writeFile } from "node:fs/promises"
import path from "node:path"

import { type Page } from "playwright-core"

import { launchChromiumBrowser } from "./browser-launch"

export const ACTIVATION_FLOW_RUNNER_DETECTOR_VERSION =
  "shopify_activation_flow_runner_v1"

const DEFAULT_NAVIGATION_TIMEOUT_MS = 12_000
const DEFAULT_SETTLE_WAIT_MS = 1_200
const DEFAULT_ACTION_TIMEOUT_MS = 6_000

const AUTH_ACTION_TOKENS = [
  "sign in",
  "log in",
  "login",
  "account",
  "my account",
  "password",
]

const EMPTY_STATE_TOKENS = [
  "nothing here",
  "nothing yet",
  "no data",
  "no items",
  "no products",
  "empty state",
  "create your first",
  "add your first",
  "connect your",
  "no results",
]

const BLOCKED_GATE_TOKENS = [
  "password",
  "sign in",
  "login",
  "log in",
  "access denied",
  "forbidden",
  "not authorized",
  "coming soon",
  "invite only",
]

const MEANINGFUL_ACTION_TOKENS = [
  "get started",
  "start",
  "continue",
  "next",
  "begin",
  "create",
  "add",
  "connect",
  "install",
  "setup",
  "set up",
  "onboard",
  "complete",
  "launch",
  "shop",
  "buy",
  "checkout",
  "cart",
  "subscribe",
  "upgrade",
  "trial",
  "pricing",
  "plans",
  "products",
]

export type ActivationFlowGuidedCheckV1 =
  | "entry_surface_loaded"
  | "entry_has_next_action"
  | "entry_not_empty_without_path"
  | "first_forward_progression"

export type ActivationFlowActionKindV1 = "link" | "button"

export type ActivationPageClassificationV1 =
  | "progression_surface"
  | "empty_state_with_next_action"
  | "empty_state_without_next_action"
  | "blocked_gate"
  | "no_clear_next_action"
  | "unreachable"

export type ActivationFlowStepIdV1 = "entry_surface" | "forward_progression"

export type ActivationFlowStepStatusV1 = "passed" | "failed" | "skipped"

export type ActivationFlowRunStatusV1 = "completed" | "skipped" | "failed"

export type ActivationFlowProgressionOutcomeV1 =
  | "progressed"
  | "stalled"
  | "blocked"
  | "runner_unavailable"
  | "runner_failed"
  | "skipped"

export type ActivationFlowDeadEndReasonV1 =
  | "entry_unreachable"
  | "entry_blocked_gate"
  | "empty_state_without_next_action"
  | "missing_next_action"
  | "primary_action_not_executable"
  | "stalled_after_entry_action"

export type ActivationPageIntentHintV1 =
  | "onboarding"
  | "activation"
  | "first_value"
  | "checkout_handoff"

export interface ActivationFlowHintsV1 {
  preferredEntryUrl?: string | null
  onboardingPathUrl?: string | null
  preferredPrimaryCtaSelector?: string | null
  preferredNextActionSelector?: string | null
  firstValueAreaSelector?: string | null
  authExpected?: boolean | null
  pageIntentHint?: ActivationPageIntentHintV1 | null
}

export interface ActivationFlowPathV1 {
  id: "shopify_entry_to_first_value_v1"
  label: string
  entryUrl: string
  startPath: string | null
  maxGuidedSteps: number
  guidedChecks: ActivationFlowGuidedCheckV1[]
}

export interface ActivationFlowActionV1 {
  kind: ActivationFlowActionKindV1
  label: string
  href: string | null
  meaningful: boolean
  forwardPath: boolean
  inMain: boolean
  inHeaderOrFooter: boolean
  authAction: boolean
  inAuthForm: boolean
}

export interface ActivationFlowStepResultV1 {
  stepId: ActivationFlowStepIdV1
  status: ActivationFlowStepStatusV1
  inspectedAt: string
  inspectedUrl: string | null
  pageClassification: ActivationPageClassificationV1 | null
  meaningfulCtaCount: number
  nextActionCount: number
  emptyStateSignals: string[]
  blockedSignals: string[]
  topActions: string[]
  screenshotRef: string | null
  detail: string | null
}

export interface ActivationFlowRunSummaryV1 {
  runId: string
  pathId: ActivationFlowPathV1["id"]
  startedAt: string
  completedAt: string
  entryUrl: string
  finalUrl: string | null
  progressionOutcome: ActivationFlowProgressionOutcomeV1
  deadEndDetected: boolean
  deadEndReason: ActivationFlowDeadEndReasonV1 | null
  entryPageClassification: ActivationPageClassificationV1 | null
  finalPageClassification: ActivationPageClassificationV1 | null
  entryMeaningfulCtaCount: number
  finalMeaningfulCtaCount: number
  entryNextActionCount: number
  finalNextActionCount: number
  primaryActionLabel: string | null
  primaryActionKind: ActivationFlowActionKindV1 | null
  primaryActionTarget: string | null
  entryEmptyStateSignals: string[]
  entryBlockedSignals: string[]
  stepsInspected: number
  entryScreenshotRef: string | null
  progressionScreenshotRef: string | null
  entryScreenshotSha256: string | null
  progressionScreenshotSha256: string | null
  entryScreenshotBytes: number | null
  progressionScreenshotBytes: number | null
  hintPrimarySelector: string | null
  hintPrimarySelectorMatched: boolean
  hintNextActionSelector: string | null
  hintNextActionSelectorMatched: boolean
  hintFirstValueAreaSelector: string | null
  hintFirstValueAreaMatched: boolean
  hintAuthExpected: boolean
  hintPageIntent: ActivationPageIntentHintV1 | null
}

export interface ActivationFlowRunResultV1 {
  detectorVersion: string
  path: ActivationFlowPathV1
  status: ActivationFlowRunStatusV1
  steps: ActivationFlowStepResultV1[]
  summary: ActivationFlowRunSummaryV1
  errorMessage: string | null
}

export interface ActivationFlowRunnerInputV1 {
  runId: string
  entryUrl: string
  startPath?: string | null
  hints?: ActivationFlowHintsV1 | null
  captureScreenshots?: boolean
  screenshotDirectory?: string | null
}

interface PageInspectionSnapshot {
  url: string
  classification: ActivationPageClassificationV1
  meaningfulCtaCount: number
  nextActionCount: number
  emptyStateSignals: string[]
  blockedSignals: string[]
  primaryAction: ActivationFlowActionV1 | null
  topActions: string[]
}

interface RawDomAction {
  kind: string
  label: string
  href: string | null
  inMain: boolean
  inHeader: boolean
  inFooter: boolean
  y: number
  inAuthForm: boolean
}

interface DomInspectionPayload {
  bodyText: string
  mainText: string
  pageTitle: string
  hasPasswordInput: boolean
  hasAuthForm: boolean
  actions: RawDomAction[]
}

interface ScreenshotCapture {
  reference: string
  sha256: string | null
  bytes: number | null
}

interface SelectorInspection {
  matched: boolean
  visible: boolean
  label: string | null
  href: string | null
  kind: ActivationFlowActionKindV1 | null
  inAuthForm: boolean
}

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeActionLabel(label: string) {
  return cleanWhitespace(label).toLowerCase()
}

function includesAnyToken(haystack: string, tokens: readonly string[]) {
  return tokens.some((token) => haystack.includes(token))
}

function stripHash(input: string) {
  try {
    const url = new URL(input)
    url.hash = ""
    return url.toString()
  } catch {
    return input
  }
}

function resolveEntryUrl(input: { entryUrl: string; startPath: string | null }) {
  let base: URL
  try {
    base = new URL(input.entryUrl)
  } catch {
    return null
  }

  if (!input.startPath) {
    return base.toString()
  }

  try {
    return new URL(input.startPath, base).toString()
  } catch {
    return base.toString()
  }
}

function normalizeDomAction(
  raw: RawDomAction,
  currentUrl: URL
): ActivationFlowActionV1 | null {
  const kind: ActivationFlowActionKindV1 = raw.kind === "button" ? "button" : "link"
  const label = cleanWhitespace(raw.label)
  const labelLower = normalizeActionLabel(label)
  let href: string | null = null
  let forwardPath = false

  if (raw.href) {
    const rawHref = raw.href.trim()
    if (
      rawHref.length > 0 &&
      !rawHref.startsWith("#") &&
      !rawHref.toLowerCase().startsWith("javascript:") &&
      !rawHref.toLowerCase().startsWith("mailto:") &&
      !rawHref.toLowerCase().startsWith("tel:")
    ) {
      try {
        const parsed = new URL(rawHref, currentUrl.toString())
        const sameOrigin = parsed.origin === currentUrl.origin
        const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/"
        const notEntryRoot = normalizedPath !== "/" || parsed.search.length > 0
        href = parsed.toString()
        forwardPath = sameOrigin && notEntryRoot
      } catch {
        href = null
      }
    }
  }

  const hrefLower = href ? href.toLowerCase() : ""
  const authAction =
    raw.inAuthForm ||
    includesAnyToken(labelLower, AUTH_ACTION_TOKENS) ||
    includesAnyToken(hrefLower, AUTH_ACTION_TOKENS)
  const meaningful =
    includesAnyToken(labelLower, MEANINGFUL_ACTION_TOKENS) ||
    includesAnyToken(hrefLower, MEANINGFUL_ACTION_TOKENS)

  if (!label && !href) {
    return null
  }

  return {
    kind,
    label: label || "Untitled action",
    href,
    meaningful,
    forwardPath,
    inMain: raw.inMain,
    inHeaderOrFooter: raw.inHeader || raw.inFooter,
    authAction,
    inAuthForm: raw.inAuthForm,
  }
}

function scoreAction(action: ActivationFlowActionV1) {
  let score = 0
  const label = action.label.toLowerCase()
  const href = action.href?.toLowerCase() ?? ""

  if (action.forwardPath) {
    score += 6
  }
  if (action.meaningful) {
    score += 4
  }
  if (action.kind === "button") {
    score += 1
  }
  if (action.inMain) {
    score += 3
  }
  if (action.inHeaderOrFooter) {
    score -= 2
  }
  if (action.authAction) {
    score -= 3
  }
  if (label === "untitled action") {
    score -= 5
  }
  if (label.includes("get started") || label.includes("start") || label.includes("continue")) {
    score += 2
  }
  if (
    href.includes("/products") ||
    href.includes("/collections") ||
    href.includes("/pricing") ||
    href.includes("/signup") ||
    href.includes("/register") ||
    href.includes("/checkout") ||
    href.includes("/cart")
  ) {
    score += 2
  }

  return score
}

function classifySurface(input: {
  emptyStateSignals: string[]
  blockedSignals: string[]
  meaningfulCtaCount: number
  nextActionCount: number
  hasAuthSignals: boolean
  authOnlyNextActions: boolean
}) {
  if (
    (input.blockedSignals.length > 0 || input.hasAuthSignals) &&
    (input.nextActionCount <= 1 || input.authOnlyNextActions)
  ) {
    return "blocked_gate" as const
  }

  if (input.emptyStateSignals.length > 0 && input.nextActionCount === 0) {
    return "empty_state_without_next_action" as const
  }

  if (input.emptyStateSignals.length > 0 && input.nextActionCount > 0) {
    return "empty_state_with_next_action" as const
  }

  if (input.meaningfulCtaCount === 0 || input.nextActionCount === 0) {
    return "no_clear_next_action" as const
  }

  return "progression_surface" as const
}

function toActionSample(action: ActivationFlowActionV1) {
  const target = action.href ?? "inline-action"
  return `${action.kind}:${action.label} -> ${target}`
}

function toSafeFileSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 64)
}

function normalizeSelector(input: string | null | undefined) {
  if (!input) {
    return null
  }
  const trimmed = input.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function inspectSelectorOnPage(
  page: Page,
  selector: string | null
): Promise<SelectorInspection | null> {
  if (!selector) {
    return null
  }

  try {
    const inspection = (await page.evaluate((targetSelector) => {
      const element = document.querySelector(targetSelector)
      if (!element || !(element instanceof HTMLElement)) {
        return {
          matched: false,
          visible: false,
          label: null,
          href: null,
          kind: null,
          inAuthForm: false,
        }
      }

      const style = window.getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      const visible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.width > 2 &&
        rect.height > 2
      const rawText =
        element instanceof HTMLInputElement
          ? element.value || element.getAttribute("aria-label") || ""
          : element.textContent || element.getAttribute("aria-label") || ""
      const label = rawText.replace(/\s+/g, " ").trim()
      const href =
        element instanceof HTMLAnchorElement
          ? element.getAttribute("href")
          : null
      const kind = element.tagName.toLowerCase() === "a" ? "link" : "button"
      const parentForm = element.closest("form")
      const inAuthForm =
        parentForm !== null &&
        (parentForm.querySelector("input[type='password']") !== null ||
          /login|sign[- ]?in|auth/i.test(parentForm.getAttribute("action") || ""))

      return {
        matched: true,
        visible,
        label: label || null,
        href,
        kind,
        inAuthForm,
      }
    }, selector)) as SelectorInspection

    return inspection
  } catch {
    return null
  }
}

async function actionFromSelectorHint(input: {
  page: Page
  selector: string | null
  currentUrl: URL
}) {
  const inspection = await inspectSelectorOnPage(input.page, input.selector)
  if (!inspection || !inspection.matched || !inspection.visible) {
    return {
      action: null,
      matched: false,
    }
  }

  const raw: RawDomAction = {
    kind: inspection.kind ?? "button",
    label: inspection.label ?? "",
    href: inspection.href ?? null,
    inMain: false,
    inHeader: false,
    inFooter: false,
    y: 0,
    inAuthForm: inspection.inAuthForm,
  }
  const action = normalizeDomAction(raw, input.currentUrl)
  return {
    action,
    matched: Boolean(action),
  }
}

async function captureScreenshot(input: {
  page: Page
  runId: string
  label: "entry" | "progression"
  captureEnabled: boolean
  directory: string | null
}): Promise<ScreenshotCapture | null> {
  if (!input.captureEnabled) {
    return null
  }

  const targetDir =
    input.directory ??
    path.join(process.cwd(), "public", "evidence", "activation-flow-runs")

  try {
    await mkdir(targetDir, { recursive: true })
    const fileName = `${toSafeFileSegment(input.runId)}-${Date.now()}-${input.label}.png`
    const absolutePath = path.join(targetDir, fileName)
    const imageBuffer = await input.page.screenshot({
      fullPage: true,
      timeout: DEFAULT_ACTION_TIMEOUT_MS,
    })
    await writeFile(absolutePath, imageBuffer)
    const sha256 = createHash("sha256").update(imageBuffer).digest("hex")
    const fileStat = await stat(absolutePath).catch(() => null)

    const publicRoot = path.join(process.cwd(), "public")
    const reference = absolutePath.startsWith(publicRoot)
      ? absolutePath
          .slice(publicRoot.length)
          .replaceAll("\\", "/")
          .replace(/^\/?/, "/")
      : absolutePath

    return {
      reference,
      sha256,
      bytes: fileStat?.size ?? imageBuffer.byteLength,
    }
  } catch {
    return null
  }
}

function buildSkippedResult(input: {
  runId: string
  path: ActivationFlowPathV1
  reason: string
  outcome: ActivationFlowProgressionOutcomeV1
}) {
  const completedAt = new Date().toISOString()
  return {
    detectorVersion: ACTIVATION_FLOW_RUNNER_DETECTOR_VERSION,
    path: input.path,
    status: "skipped" as const,
    steps: [],
    summary: {
      runId: input.runId,
      pathId: input.path.id,
      startedAt: completedAt,
      completedAt,
      entryUrl: input.path.entryUrl,
      finalUrl: null,
      progressionOutcome: input.outcome,
      deadEndDetected: false,
      deadEndReason: null,
      entryPageClassification: null,
      finalPageClassification: null,
      entryMeaningfulCtaCount: 0,
      finalMeaningfulCtaCount: 0,
      entryNextActionCount: 0,
      finalNextActionCount: 0,
      primaryActionLabel: null,
      primaryActionKind: null,
      primaryActionTarget: null,
      entryEmptyStateSignals: [],
      entryBlockedSignals: [],
      stepsInspected: 0,
      entryScreenshotRef: null,
      progressionScreenshotRef: null,
      entryScreenshotSha256: null,
      progressionScreenshotSha256: null,
      entryScreenshotBytes: null,
      progressionScreenshotBytes: null,
      hintPrimarySelector: null,
      hintPrimarySelectorMatched: false,
      hintNextActionSelector: null,
      hintNextActionSelectorMatched: false,
      hintFirstValueAreaSelector: null,
      hintFirstValueAreaMatched: false,
      hintAuthExpected: false,
      hintPageIntent: null,
    },
    errorMessage: input.reason,
  } satisfies ActivationFlowRunResultV1
}

async function inspectPage(page: Page): Promise<PageInspectionSnapshot> {
  const currentUrl = new URL(page.url())
  const payload = (await page.evaluate(() => {
    const actions = Array.from(
      document.querySelectorAll(
        "a[href],button,[role='button'],input[type='button'],input[type='submit']"
      )
    )
      .map((element) => {
        if (!(element instanceof HTMLElement)) {
          return null
        }
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        const visible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          rect.width > 2 &&
          rect.height > 2
        if (!visible) {
          return null
        }

        const rawText =
          element instanceof HTMLInputElement
            ? element.value || element.getAttribute("aria-label") || ""
            : element.textContent || element.getAttribute("aria-label") || ""
        const label = rawText.replace(/\s+/g, " ").trim()
        if (!label && element.tagName.toLowerCase() !== "a") {
          return null
        }

        const kind = element.tagName.toLowerCase() === "a" ? "link" : "button"
        const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") : null
        const inMain = Boolean(element.closest("main"))
        const inHeader = Boolean(element.closest("header"))
        const inFooter = Boolean(element.closest("footer"))
        const parentForm = element.closest("form")
        const inAuthForm =
          parentForm !== null &&
          (parentForm.querySelector("input[type='password']") !== null ||
            /login|sign[- ]?in|auth/i.test(parentForm.getAttribute("action") || ""))

        return {
          kind,
          label,
          href,
          inMain,
          inHeader,
          inFooter,
          y: Math.round(rect.top),
          inAuthForm,
        }
      })
      .filter((item): item is RawDomAction => Boolean(item))
      .slice(0, 80)

    const bodyText = (document.body?.innerText ?? "").replace(/\s+/g, " ").trim()
    const mainText = (
      document.querySelector("main")?.textContent ??
      document.body?.innerText ??
      ""
    )
      .replace(/\s+/g, " ")
      .trim()
    const hasPasswordInput =
      document.querySelector("input[type='password']") !== null
    const hasAuthForm =
      document.querySelector(
        "form[action*='login' i],form[action*='sign' i],input[name*='password' i]"
      ) !== null
    const pageTitle = document.title ?? ""

    return {
      bodyText: bodyText.slice(0, 2400),
      mainText: mainText.slice(0, 2400),
      pageTitle: pageTitle.slice(0, 200),
      hasPasswordInput,
      hasAuthForm,
      actions,
    }
  })) as DomInspectionPayload

  const bodyLower = payload.bodyText.toLowerCase()
  const mainLower = payload.mainText.toLowerCase()
  const titleLower = payload.pageTitle.toLowerCase()
  const emptyStateSignals = EMPTY_STATE_TOKENS.filter((token) =>
    mainLower.includes(token)
  )
  const blockedSignals = BLOCKED_GATE_TOKENS.filter((token) =>
    bodyLower.includes(token) || titleLower.includes(token)
  )

  const dedupe = new Set<string>()
  const actions = payload.actions
    .map((raw) => normalizeDomAction(raw, currentUrl))
    .filter((action): action is ActivationFlowActionV1 => Boolean(action))
    .filter((action) => {
      const key = `${action.kind}|${action.label.toLowerCase()}|${action.href ?? ""}`
      if (dedupe.has(key)) {
        return false
      }
      dedupe.add(key)
      return true
    })

  const mainActions = actions.filter((action) => action.inMain)
  const scopedActions = mainActions.length > 0 ? mainActions : actions
  const nonAuthScopedActions = scopedActions.filter((action) => !action.authAction)

  const meaningfulCtaCount = nonAuthScopedActions.filter(
    (action) => action.meaningful
  ).length
  const nextActionCount = nonAuthScopedActions.filter(
    (action) => action.meaningful || action.forwardPath
  ).length

  const sortedActions = [...nonAuthScopedActions].sort((left, right) => {
    return scoreAction(right) - scoreAction(left)
  })
  const primaryAction = sortedActions.length > 0 ? sortedActions[0] : null
  const hasAuthSignals = payload.hasPasswordInput || payload.hasAuthForm
  const authOnlyNextActions =
    scopedActions.length > 0 &&
    scopedActions.every(
      (action) => action.authAction || !(action.meaningful || action.forwardPath)
    )
  const classification = classifySurface({
    emptyStateSignals,
    blockedSignals,
    meaningfulCtaCount,
    nextActionCount,
    hasAuthSignals,
    authOnlyNextActions,
  })

  return {
    url: currentUrl.toString(),
    classification,
    meaningfulCtaCount,
    nextActionCount,
    emptyStateSignals,
    blockedSignals,
    primaryAction,
    topActions: sortedActions.slice(0, 6).map(toActionSample),
  }
}

function didProgress(input: {
  entry: PageInspectionSnapshot
  next: PageInspectionSnapshot
}) {
  if (input.next.classification === "blocked_gate") {
    return false
  }

  if (stripHash(input.entry.url) !== stripHash(input.next.url)) {
    return true
  }

  if (
    input.entry.classification !== input.next.classification &&
    input.next.nextActionCount > 0
  ) {
    return true
  }

  if (input.next.meaningfulCtaCount > input.entry.meaningfulCtaCount) {
    return true
  }

  return false
}

async function executePrimaryAction(input: {
  page: Page
  action: ActivationFlowActionV1 | null
}) {
  if (!input.action) {
    return false
  }

  if (input.action.forwardPath && input.action.href) {
    try {
      await input.page.goto(input.action.href, {
        waitUntil: "domcontentloaded",
        timeout: DEFAULT_NAVIGATION_TIMEOUT_MS,
      })
      await input.page.waitForTimeout(DEFAULT_SETTLE_WAIT_MS)
      return true
    } catch {
      return false
    }
  }

  if (input.action.kind !== "button") {
    return false
  }

  try {
    const clicked = await input.page.evaluate((targetLabel) => {
      const normalized = targetLabel.trim().toLowerCase()
      const elements = Array.from(
        document.querySelectorAll(
          "button,[role='button'],input[type='button'],input[type='submit']"
        )
      )

      for (const element of elements) {
        if (!(element instanceof HTMLElement)) {
          continue
        }
        const text =
          element instanceof HTMLInputElement
            ? element.value || element.getAttribute("aria-label") || ""
            : element.textContent || element.getAttribute("aria-label") || ""
        const current = text.replace(/\s+/g, " ").trim().toLowerCase()
        if (!current) {
          continue
        }
        if (current === normalized || current.includes(normalized)) {
          element.click()
          return true
        }
      }
      return false
    }, input.action.label)

    if (!clicked) {
      return false
    }

    await Promise.race([
      input.page
        .waitForLoadState("domcontentloaded", { timeout: DEFAULT_ACTION_TIMEOUT_MS })
        .catch(() => null),
      input.page.waitForTimeout(DEFAULT_SETTLE_WAIT_MS),
    ])
    await input.page.waitForTimeout(DEFAULT_SETTLE_WAIT_MS)
    return true
  } catch {
    return false
  }
}

export async function runActivationFlowV1(
  input: ActivationFlowRunnerInputV1
): Promise<ActivationFlowRunResultV1> {
  const hintPrimarySelector = normalizeSelector(
    input.hints?.preferredPrimaryCtaSelector ?? null
  )
  const hintNextActionSelector = normalizeSelector(
    input.hints?.preferredNextActionSelector ?? null
  )
  const hintFirstValueAreaSelector = normalizeSelector(
    input.hints?.firstValueAreaSelector ?? null
  )
  const hintAuthExpected = input.hints?.authExpected === true
  const hintPageIntent = input.hints?.pageIntentHint ?? null
  const hintedEntryUrl =
    normalizeSelector(input.hints?.preferredEntryUrl ?? null) ??
    normalizeSelector(input.entryUrl)
  const hintedStartPath =
    normalizeSelector(input.hints?.onboardingPathUrl ?? null) ??
    normalizeSelector(input.startPath ?? null)

  const resolvedEntryUrl = resolveEntryUrl({
    entryUrl: hintedEntryUrl ?? input.entryUrl,
    startPath: hintedStartPath ?? null,
  })

  const pathModel: ActivationFlowPathV1 = {
    id: "shopify_entry_to_first_value_v1",
    label: "Shopify entry to first-value progression",
    entryUrl: resolvedEntryUrl ?? (hintedEntryUrl ?? input.entryUrl),
    startPath: hintedStartPath ?? null,
    maxGuidedSteps: 2,
    guidedChecks: [
      "entry_surface_loaded",
      "entry_has_next_action",
      "entry_not_empty_without_path",
      "first_forward_progression",
    ],
  }

  if (!resolvedEntryUrl) {
    return buildSkippedResult({
      runId: input.runId,
      path: pathModel,
      reason: "Entry URL is missing or invalid.",
      outcome: "skipped",
    })
  }

  const startedAt = new Date().toISOString()

  let browser: Awaited<ReturnType<typeof launchChromiumBrowser>> | null = null
  let status: ActivationFlowRunStatusV1 = "completed"
  let errorMessage: string | null = null
  const steps: ActivationFlowStepResultV1[] = []

  let entrySnapshot: PageInspectionSnapshot | null = null
  let progressionSnapshot: PageInspectionSnapshot | null = null
  let progressionOutcome: ActivationFlowProgressionOutcomeV1 = "stalled"
  let deadEndDetected = false
  let deadEndReason: ActivationFlowDeadEndReasonV1 | null = null
  let entryScreenshot: ScreenshotCapture | null = null
  let progressionScreenshot: ScreenshotCapture | null = null
  let chosenPrimaryAction: ActivationFlowActionV1 | null = null
  let hintPrimarySelectorMatched = false
  let hintNextActionSelectorMatched = false
  let hintFirstValueAreaSelectorMatched = false

  try {
    try {
      browser = await launchChromiumBrowser()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return buildSkippedResult({
        runId: input.runId,
        path: pathModel,
        reason: message,
        outcome: "runner_unavailable",
      })
    }

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        "SilentLeakActivationRunner/1.0 (+https://checkoutleak.com)",
    })
    const page = await context.newPage()

    try {
      await page.goto(pathModel.entryUrl, {
        waitUntil: "domcontentloaded",
        timeout: DEFAULT_NAVIGATION_TIMEOUT_MS,
      })
      await page.waitForTimeout(DEFAULT_SETTLE_WAIT_MS)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const failedStep: ActivationFlowStepResultV1 = {
        stepId: "entry_surface",
        status: "failed",
        inspectedAt: new Date().toISOString(),
        inspectedUrl: pathModel.entryUrl,
        pageClassification: "unreachable",
        meaningfulCtaCount: 0,
        nextActionCount: 0,
        emptyStateSignals: [],
        blockedSignals: [],
        topActions: [],
        screenshotRef: null,
        detail: message,
      }
      steps.push(failedStep)
      progressionOutcome = "blocked"
      deadEndDetected = true
      deadEndReason = "entry_unreachable"
      return {
        detectorVersion: ACTIVATION_FLOW_RUNNER_DETECTOR_VERSION,
        path: pathModel,
        status: "completed",
        steps,
        summary: {
          runId: input.runId,
          pathId: pathModel.id,
          startedAt,
          completedAt: new Date().toISOString(),
          entryUrl: pathModel.entryUrl,
          finalUrl: null,
          progressionOutcome,
          deadEndDetected,
          deadEndReason,
          entryPageClassification: "unreachable",
          finalPageClassification: null,
          entryMeaningfulCtaCount: 0,
          finalMeaningfulCtaCount: 0,
          entryNextActionCount: 0,
          finalNextActionCount: 0,
          primaryActionLabel: null,
          primaryActionKind: null,
          primaryActionTarget: null,
          entryEmptyStateSignals: [],
          entryBlockedSignals: [],
          stepsInspected: steps.length,
          entryScreenshotRef: null,
          progressionScreenshotRef: null,
          entryScreenshotSha256: null,
          progressionScreenshotSha256: null,
          entryScreenshotBytes: null,
          progressionScreenshotBytes: null,
          hintPrimarySelector,
          hintPrimarySelectorMatched,
          hintNextActionSelector,
          hintNextActionSelectorMatched,
          hintFirstValueAreaSelector,
          hintFirstValueAreaMatched: hintFirstValueAreaSelectorMatched,
          hintAuthExpected,
          hintPageIntent,
        },
        errorMessage: message,
      } satisfies ActivationFlowRunResultV1
    }

    entrySnapshot = await inspectPage(page)
    let selectedPrimaryAction = entrySnapshot.primaryAction
    if (hintPrimarySelector) {
      const hintedAction = await actionFromSelectorHint({
        page,
        selector: hintPrimarySelector,
        currentUrl: new URL(entrySnapshot.url),
      })
      hintPrimarySelectorMatched = hintedAction.matched
      if (hintedAction.action) {
        selectedPrimaryAction = hintedAction.action
      }
    }
    chosenPrimaryAction = selectedPrimaryAction
    entryScreenshot = await captureScreenshot({
      page,
      runId: input.runId,
      label: "entry",
      captureEnabled: input.captureScreenshots ?? false,
      directory: input.screenshotDirectory ?? null,
    })

    const entryStep: ActivationFlowStepResultV1 = {
      stepId: "entry_surface",
      status: "passed",
      inspectedAt: new Date().toISOString(),
      inspectedUrl: entrySnapshot.url,
      pageClassification: entrySnapshot.classification,
      meaningfulCtaCount: entrySnapshot.meaningfulCtaCount,
      nextActionCount: entrySnapshot.nextActionCount,
      emptyStateSignals: entrySnapshot.emptyStateSignals,
      blockedSignals: entrySnapshot.blockedSignals,
      topActions: entrySnapshot.topActions,
      screenshotRef: entryScreenshot?.reference ?? null,
      detail: hintPrimarySelector
        ? hintPrimarySelectorMatched
          ? `Hint primary selector matched: ${hintPrimarySelector}`
          : `Hint primary selector not matched: ${hintPrimarySelector}`
        : null,
    }
    steps.push(entryStep)

    if (entrySnapshot.classification === "blocked_gate") {
      progressionOutcome = "blocked"
      deadEndDetected = true
      deadEndReason = "entry_blocked_gate"
    } else if (
      entrySnapshot.classification === "empty_state_without_next_action"
    ) {
      progressionOutcome = "stalled"
      deadEndDetected = true
      deadEndReason = "empty_state_without_next_action"
    } else if (!selectedPrimaryAction) {
      progressionOutcome = "stalled"
      deadEndDetected = true
      deadEndReason = "missing_next_action"
    } else {
      const actionExecuted = await executePrimaryAction({
        page,
        action: selectedPrimaryAction,
      })

      if (!actionExecuted) {
        progressionOutcome = "stalled"
        deadEndDetected = true
        deadEndReason = "primary_action_not_executable"
      } else {
        progressionSnapshot = await inspectPage(page)
        progressionScreenshot = await captureScreenshot({
          page,
          runId: input.runId,
          label: "progression",
          captureEnabled: input.captureScreenshots ?? false,
          directory: input.screenshotDirectory ?? null,
        })

        const nextSelectorInspection = await inspectSelectorOnPage(
          page,
          hintNextActionSelector
        )
        const firstValueInspection = await inspectSelectorOnPage(
          page,
          hintFirstValueAreaSelector
        )
        hintNextActionSelectorMatched = Boolean(
          nextSelectorInspection?.matched && nextSelectorInspection.visible
        )
        hintFirstValueAreaSelectorMatched = Boolean(
          firstValueInspection?.matched && firstValueInspection.visible
        )

        const progressed = didProgress({
          entry: entrySnapshot,
          next: progressionSnapshot,
        }) || hintNextActionSelectorMatched || hintFirstValueAreaSelectorMatched

        const progressionStep: ActivationFlowStepResultV1 = {
          stepId: "forward_progression",
          status: progressed ? "passed" : "failed",
          inspectedAt: new Date().toISOString(),
          inspectedUrl: progressionSnapshot.url,
          pageClassification: progressionSnapshot.classification,
          meaningfulCtaCount: progressionSnapshot.meaningfulCtaCount,
          nextActionCount: progressionSnapshot.nextActionCount,
          emptyStateSignals: progressionSnapshot.emptyStateSignals,
          blockedSignals: progressionSnapshot.blockedSignals,
          topActions: progressionSnapshot.topActions,
          screenshotRef: progressionScreenshot?.reference ?? null,
          detail: progressed
            ? [
                "Primary action progressed to a new reachable step.",
                hintNextActionSelector
                  ? hintNextActionSelectorMatched
                    ? `Hint next-action selector matched: ${hintNextActionSelector}`
                    : `Hint next-action selector not matched: ${hintNextActionSelector}`
                  : null,
                hintFirstValueAreaSelector
                  ? hintFirstValueAreaSelectorMatched
                    ? `Hint first-value selector matched: ${hintFirstValueAreaSelector}`
                    : `Hint first-value selector not matched: ${hintFirstValueAreaSelector}`
                  : null,
              ]
                .filter(Boolean)
                .join(" ")
            : [
                "Primary action did not produce a clear forward progression.",
                hintNextActionSelector
                  ? `Hint next-action selector not matched: ${hintNextActionSelector}`
                  : null,
                hintFirstValueAreaSelector
                  ? `Hint first-value selector not matched: ${hintFirstValueAreaSelector}`
                  : null,
              ]
                .filter(Boolean)
                .join(" "),
        }
        steps.push(progressionStep)

        if (progressed) {
          progressionOutcome = "progressed"
          deadEndDetected = false
          deadEndReason = null
        } else {
          progressionOutcome =
            progressionSnapshot.classification === "blocked_gate" ? "blocked" : "stalled"
          deadEndDetected = true
          deadEndReason = "stalled_after_entry_action"
        }
      }
    }
  } catch (error) {
    status = "failed"
    progressionOutcome = "runner_failed"
    deadEndDetected = false
    deadEndReason = null
    errorMessage = error instanceof Error ? error.message : String(error)
  } finally {
    if (browser) {
      await browser.close().catch(() => null)
    }
  }

  const completedAt = new Date().toISOString()
  const finalSnapshot = progressionSnapshot ?? entrySnapshot

  return {
    detectorVersion: ACTIVATION_FLOW_RUNNER_DETECTOR_VERSION,
    path: pathModel,
    status,
    steps,
    summary: {
      runId: input.runId,
      pathId: pathModel.id,
      startedAt,
      completedAt,
      entryUrl: pathModel.entryUrl,
      finalUrl: finalSnapshot?.url ?? null,
      progressionOutcome,
      deadEndDetected,
      deadEndReason,
      entryPageClassification: entrySnapshot?.classification ?? null,
      finalPageClassification: finalSnapshot?.classification ?? null,
      entryMeaningfulCtaCount: entrySnapshot?.meaningfulCtaCount ?? 0,
      finalMeaningfulCtaCount: finalSnapshot?.meaningfulCtaCount ?? 0,
      entryNextActionCount: entrySnapshot?.nextActionCount ?? 0,
      finalNextActionCount: finalSnapshot?.nextActionCount ?? 0,
      primaryActionLabel: chosenPrimaryAction?.label ?? null,
      primaryActionKind: chosenPrimaryAction?.kind ?? null,
      primaryActionTarget: chosenPrimaryAction?.href ?? null,
      entryEmptyStateSignals: entrySnapshot?.emptyStateSignals ?? [],
      entryBlockedSignals: entrySnapshot?.blockedSignals ?? [],
      stepsInspected: steps.length,
      entryScreenshotRef: entryScreenshot?.reference ?? null,
      progressionScreenshotRef: progressionScreenshot?.reference ?? null,
      entryScreenshotSha256: entryScreenshot?.sha256 ?? null,
      progressionScreenshotSha256: progressionScreenshot?.sha256 ?? null,
      entryScreenshotBytes: entryScreenshot?.bytes ?? null,
      progressionScreenshotBytes: progressionScreenshot?.bytes ?? null,
      hintPrimarySelector,
      hintPrimarySelectorMatched,
      hintNextActionSelector,
      hintNextActionSelectorMatched,
      hintFirstValueAreaSelector,
      hintFirstValueAreaMatched: hintFirstValueAreaSelectorMatched,
      hintAuthExpected,
      hintPageIntent,
    },
    errorMessage,
  } satisfies ActivationFlowRunResultV1
}
