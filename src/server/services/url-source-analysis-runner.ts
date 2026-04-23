export const URL_SOURCE_ANALYSIS_RUNNER_DETECTOR_VERSION =
  "url_source_surface_runner_v1"

export type UrlSourceSurfaceClassificationV1 =
  | "marketing_only"
  | "app_first"
  | "ecommerce"
  | "mixed"
  | "unknown"
  | "unreachable"

export type UrlSourceRevenuePathClarityV1 = "clear" | "partial" | "none"

export type UrlSourceAnalysisRunStatusV1 = "completed" | "skipped" | "failed"

export interface UrlSourceAnalysisSummaryV1 {
  runId: string
  startedAt: string
  completedAt: string
  entryUrl: string
  finalUrl: string | null
  httpStatus: number | null
  surfaceClassification: UrlSourceSurfaceClassificationV1
  revenuePathClarity: UrlSourceRevenuePathClarityV1
  noClearRevenuePath: boolean
  hasPricingPath: boolean
  hasSignupPath: boolean
  hasLoginPath: boolean
  hasPrimaryCta: boolean
  primaryCtaLabel: string | null
  hasCheckoutSignal: boolean
}

export interface UrlSourceAnalysisResultV1 {
  detectorVersion: string
  status: UrlSourceAnalysisRunStatusV1
  summary: UrlSourceAnalysisSummaryV1
  evidenceRows: Array<{ label: string; value: string }>
  errorMessage: string | null
}

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, " ")
}

function cleanWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeHttpUrl(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return null
  }
}

function includesAnyToken(haystack: string, tokens: readonly string[]) {
  return tokens.some((token) => haystack.includes(token))
}

function extractHrefTargets(html: string) {
  const matches = html.matchAll(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  )
  const links: Array<{ href: string; label: string }> = []
  for (const match of matches) {
    const href = cleanWhitespace(match[1] ?? "")
    const label = cleanWhitespace(stripHtmlTags(match[2] ?? ""))
    if (!href) {
      continue
    }
    links.push({ href, label })
    if (links.length >= 160) {
      break
    }
  }
  return links
}

function extractButtonLabels(html: string) {
  const matches = html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)
  const labels: string[] = []
  for (const match of matches) {
    const label = cleanWhitespace(stripHtmlTags(match[1] ?? ""))
    if (!label) {
      continue
    }
    labels.push(label)
    if (labels.length >= 80) {
      break
    }
  }
  return labels
}

function scorePrimaryCtaLabel(label: string) {
  const lower = label.toLowerCase()
  let score = 0
  if (
    includesAnyToken(lower, [
      "get started",
      "start free",
      "start",
      "try",
      "book demo",
      "subscribe",
    ])
  ) {
    score += 4
  }
  if (includesAnyToken(lower, ["sign up", "create account", "join"])) {
    score += 3
  }
  if (includesAnyToken(lower, ["pricing", "plans", "buy", "checkout"])) {
    score += 2
  }
  if (lower.length <= 3) {
    score -= 1
  }
  return score
}

function classifySurface(input: {
  hasPricingPath: boolean
  hasSignupPath: boolean
  hasLoginPath: boolean
  hasCheckoutSignal: boolean
  hasPrimaryCta: boolean
  bodyLower: string
}) {
  const ecommerceSignals =
    Number(input.hasCheckoutSignal) +
    Number(includesAnyToken(input.bodyLower, ["cart", "product", "collection", "shop"]))
  const appSignals =
    Number(input.hasSignupPath || input.hasLoginPath) +
    Number(includesAnyToken(input.bodyLower, ["dashboard", "workspace", "trial", "onboarding"]))

  if (ecommerceSignals >= 2 && appSignals >= 2) {
    return "mixed" as const
  }
  if (ecommerceSignals >= 2) {
    return "ecommerce" as const
  }
  if (appSignals >= 2) {
    return "app_first" as const
  }
  if (input.hasPrimaryCta || input.hasPricingPath) {
    return "marketing_only" as const
  }
  return "unknown" as const
}

function deriveRevenuePathClarity(input: {
  hasPricingPath: boolean
  hasSignupPath: boolean
  hasCheckoutSignal: boolean
  hasPrimaryCta: boolean
}) {
  const clear =
    input.hasCheckoutSignal ||
    (input.hasPricingPath && (input.hasSignupPath || input.hasPrimaryCta))

  if (clear) {
    return "clear" as const
  }

  if (
    input.hasPricingPath ||
    input.hasSignupPath ||
    input.hasPrimaryCta ||
    input.hasCheckoutSignal
  ) {
    return "partial" as const
  }

  return "none" as const
}

function buildEvidenceRows(input: {
  classification: UrlSourceSurfaceClassificationV1
  revenuePathClarity: UrlSourceRevenuePathClarityV1
  hasPricingPath: boolean
  hasSignupPath: boolean
  hasLoginPath: boolean
  hasPrimaryCta: boolean
  primaryCtaLabel: string | null
  hasCheckoutSignal: boolean
  finalUrl: string | null
  httpStatus: number | null
}) {
  return [
    { label: "Surface classification", value: input.classification },
    { label: "Revenue path clarity", value: input.revenuePathClarity },
    { label: "Pricing path detected", value: input.hasPricingPath ? "yes" : "no" },
    { label: "Signup path detected", value: input.hasSignupPath ? "yes" : "no" },
    { label: "Login path detected", value: input.hasLoginPath ? "yes" : "no" },
    { label: "Primary CTA detected", value: input.hasPrimaryCta ? "yes" : "no" },
    {
      label: "Primary CTA label",
      value: input.primaryCtaLabel ?? "none",
    },
    {
      label: "Checkout or handoff signal",
      value: input.hasCheckoutSignal ? "yes" : "no",
    },
    {
      label: "Final URL",
      value: input.finalUrl ?? "none",
    },
    {
      label: "HTTP status",
      value: input.httpStatus !== null ? String(input.httpStatus) : "unknown",
    },
  ]
}

function buildFailedResult(input: {
  runId: string
  entryUrl: string
  startedAt: string
  message: string
}): UrlSourceAnalysisResultV1 {
  const completedAt = new Date().toISOString()
  return {
    detectorVersion: URL_SOURCE_ANALYSIS_RUNNER_DETECTOR_VERSION,
    status: "failed",
    summary: {
      runId: input.runId,
      startedAt: input.startedAt,
      completedAt,
      entryUrl: input.entryUrl,
      finalUrl: null,
      httpStatus: null,
      surfaceClassification: "unreachable",
      revenuePathClarity: "none",
      noClearRevenuePath: true,
      hasPricingPath: false,
      hasSignupPath: false,
      hasLoginPath: false,
      hasPrimaryCta: false,
      primaryCtaLabel: null,
      hasCheckoutSignal: false,
    },
    evidenceRows: [
      { label: "Runner status", value: "failed" },
      { label: "Failure reason", value: input.message },
    ],
    errorMessage: input.message,
  }
}

export async function runUrlSourceAnalysisV1(input: {
  runId: string
  entryUrl: string
}): Promise<UrlSourceAnalysisResultV1> {
  const startedAt = new Date().toISOString()
  const normalizedEntryUrl = normalizeHttpUrl(input.entryUrl)
  if (!normalizedEntryUrl) {
    return buildFailedResult({
      runId: input.runId,
      entryUrl: input.entryUrl,
      startedAt,
      message: "Entry URL is missing or invalid.",
    })
  }

  let response: Response
  try {
    response = await fetch(normalizedEntryUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "CheckoutLeakUrlSourceRunner/1.0 (+https://checkoutleak.com)",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return buildFailedResult({
      runId: input.runId,
      entryUrl: normalizedEntryUrl,
      startedAt,
      message,
    })
  }

  const finalUrl = response.url || normalizedEntryUrl
  const httpStatus = response.status
  const html = await response.text().catch(() => "")
  const bodyLower = html.toLowerCase()
  const links = extractHrefTargets(html)
  const buttonLabels = extractButtonLabels(html)
  const linkHrefJoined = links.map((item) => item.href.toLowerCase()).join(" ")
  const linkLabelJoined = links.map((item) => item.label.toLowerCase()).join(" ")

  const hasPricingPath =
    includesAnyToken(linkHrefJoined, ["/pricing", "/plans", "pricing", "plan"]) ||
    includesAnyToken(linkLabelJoined, ["pricing", "plans"]) ||
    includesAnyToken(bodyLower, [" pricing ", "plans"])
  const hasSignupPath =
    includesAnyToken(linkHrefJoined, ["/signup", "/register", "/join", "/trial"]) ||
    includesAnyToken(linkLabelJoined, ["sign up", "create account", "start free", "free trial"]) ||
    includesAnyToken(bodyLower, ["sign up", "create account"])
  const hasLoginPath =
    includesAnyToken(linkHrefJoined, ["/login", "/signin", "/auth", "/account"]) ||
    includesAnyToken(linkLabelJoined, ["log in", "login", "sign in", "account"]) ||
    includesAnyToken(bodyLower, ["log in", "login", "sign in"])
  const hasCheckoutSignal =
    includesAnyToken(linkHrefJoined, ["/checkout", "/cart", "/buy", "/shop"]) ||
    includesAnyToken(linkLabelJoined, ["checkout", "cart", "buy now", "shop now"]) ||
    includesAnyToken(bodyLower, [" checkout", "cart", "buy now"])

  const ctaCandidates = [
    ...links.map((item) => item.label).filter((value) => value.length > 0),
    ...buttonLabels,
  ]
  const sortedCtas = [...ctaCandidates]
    .map((label) => ({ label, score: scorePrimaryCtaLabel(label) }))
    .sort((left, right) => right.score - left.score)
  const primaryCta = sortedCtas.find((item) => item.score > 0)?.label ?? null
  const hasPrimaryCta = primaryCta !== null

  const surfaceClassification = classifySurface({
    hasPricingPath,
    hasSignupPath,
    hasLoginPath,
    hasCheckoutSignal,
    hasPrimaryCta,
    bodyLower,
  })
  const revenuePathClarity = deriveRevenuePathClarity({
    hasPricingPath,
    hasSignupPath,
    hasCheckoutSignal,
    hasPrimaryCta,
  })
  const noClearRevenuePath = revenuePathClarity === "none"
  const completedAt = new Date().toISOString()
  const evidenceRows = buildEvidenceRows({
    classification: surfaceClassification,
    revenuePathClarity,
    hasPricingPath,
    hasSignupPath,
    hasLoginPath,
    hasPrimaryCta,
    primaryCtaLabel: primaryCta,
    hasCheckoutSignal,
    finalUrl,
    httpStatus,
  })

  return {
    detectorVersion: URL_SOURCE_ANALYSIS_RUNNER_DETECTOR_VERSION,
    status: "completed",
    summary: {
      runId: input.runId,
      startedAt,
      completedAt,
      entryUrl: normalizedEntryUrl,
      finalUrl,
      httpStatus,
      surfaceClassification,
      revenuePathClarity,
      noClearRevenuePath,
      hasPricingPath,
      hasSignupPath,
      hasLoginPath,
      hasPrimaryCta,
      primaryCtaLabel: primaryCta,
      hasCheckoutSignal,
    },
    evidenceRows,
    errorMessage: null,
  }
}
