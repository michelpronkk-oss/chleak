export const URL_SOURCE_ANALYSIS_RUNNER_DETECTOR_VERSION =
  "url_source_surface_runner_v3"

export type UrlSourceSurfaceClassificationV1 =
  | "marketing_only"
  | "app_first"
  | "ecommerce"
  | "mixed"
  | "unknown"
  | "unreachable"

export type UrlSourceRevenuePathClarityV1 = "clear" | "partial" | "none"

export type UrlSourceAnalysisRunStatusV1 = "completed" | "skipped" | "failed"

// Business model classification derived from surface signals and vocabulary.
// Distinct from surfaceClassification which describes page structure.
export type UrlSourceBusinessTypeV1 =
  | "agency"
  | "saas"
  | "service_business"
  | "ecommerce"
  | "mixed"
  | "unknown"

export type UrlSourceRevenueModelV1 =
  | "lead_generation"
  | "self_serve_signup"
  | "checkout"
  | "hybrid"
  | "unknown"

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
  // Extended path evaluation fields
  businessType: UrlSourceBusinessTypeV1
  revenueModel: UrlSourceRevenueModelV1
  hasMobileViewport: boolean
  hasContactOrBookingPath: boolean
  hasSubscriptionLanguage: boolean
  responseTimeMs: number | null
}

export interface UrlSourceAnalysisResultV1 {
  detectorVersion: string
  status: UrlSourceAnalysisRunStatusV1
  summary: UrlSourceAnalysisSummaryV1
  evidenceRows: Array<{ label: string; value: string }>
  errorMessage: string | null
}

// ---------------------------------------------------------------------------
// HTML utilities
// ---------------------------------------------------------------------------

function stripInertContent(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ")
}

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`
  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return null
  }
}

// Extract the pathname from a potentially relative or absolute href.
function extractPathname(href: string, baseOrigin: string): string | null {
  try {
    const url = new URL(href, baseOrigin)
    if (url.origin !== baseOrigin && !href.startsWith("/")) {
      return null // external link
    }
    return url.pathname.toLowerCase()
  } catch {
    if (href.startsWith("/")) {
      return href.split("?")[0]!.split("#")[0]!.toLowerCase()
    }
    return null
  }
}

// True only for hrefs that represent real user-navigable pages on this site.
function isNavigableHref(href: string): boolean {
  const h = href.trim().toLowerCase()
  if (!h) return false
  if (h.startsWith("javascript:") || h.startsWith("mailto:") || h.startsWith("tel:") || h.startsWith("data:")) return false
  if (h.startsWith("#")) return false
  if (/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|pdf|xml|json|map|gz|zip)(\?|$)/i.test(h)) return false
  if (/\/_next\/|\/static\/|\/assets\/|\/cdn-cgi\/|\/wp-content\//i.test(h)) return false
  return true
}

// ---------------------------------------------------------------------------
// Link and button extraction — operate on inert-stripped HTML only
// ---------------------------------------------------------------------------

function extractNavLinks(html: string): Array<{ href: string; label: string }> {
  const matches = html.matchAll(
    /<a\b[^>]*\bhref\s*=\s*["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  )
  const links: Array<{ href: string; label: string }> = []
  for (const match of matches) {
    const href = (match[1] ?? "").trim()
    const label = cleanWhitespace(stripHtmlTags(match[2] ?? ""))
    if (!href || !isNavigableHref(href)) continue
    links.push({ href, label })
    if (links.length >= 200) break
  }
  return links
}

function extractButtonLabels(html: string): string[] {
  const labels: string[] = []
  const btnMatches = html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)
  for (const match of btnMatches) {
    const label = cleanWhitespace(stripHtmlTags(match[1] ?? ""))
    if (label && label.length <= 80) labels.push(label)
    if (labels.length >= 80) break
  }
  // Also capture <input type="submit"> values
  const inputMatches = html.matchAll(/<input\b[^>]*\btype\s*=\s*["']submit["'][^>]*\bvalue\s*=\s*["']([^"']+)["'][^>]*>/gi)
  for (const match of inputMatches) {
    const label = cleanWhitespace(match[1] ?? "")
    if (label) labels.push(label)
  }
  return labels
}

// ---------------------------------------------------------------------------
// Signal detection — precision over recall
// ---------------------------------------------------------------------------

// Matches pathname exactly as a leading segment: /pricing, /pricing/, /pricing/annual
function pathStartsWith(path: string, segments: string[]): boolean {
  return segments.some((seg) => path === seg || path.startsWith(`${seg}/`))
}

function detectPricingPath(paths: string[]): boolean {
  const pricingPaths = ["/pricing", "/plans", "/plan", "/packages", "/package", "/rates", "/subscription-plans", "/pricing-plans"]
  return paths.some((p) => pathStartsWith(p, pricingPaths))
}

function detectPricingLabel(labels: string[]): boolean {
  const rx = /^(pricing|plans?|packages?|subscription\s+plans?|see\s+pricing|view\s+pricing|our\s+pricing|compare\s+plans?)$/i
  return labels.some((l) => rx.test(l.trim()))
}

function detectSignupPath(paths: string[]): boolean {
  const signupPaths = ["/signup", "/sign-up", "/register", "/join", "/trial", "/free-trial", "/start", "/get-started", "/onboarding", "/create-account"]
  return paths.some((p) => pathStartsWith(p, signupPaths))
}

function detectSignupLabel(labels: string[]): boolean {
  const rx = /^(sign\s*up|create\s+(an?\s+)?account|get\s+started(\s+free)?|start\s+(your\s+)?(free\s+)?(trial|today)?|free\s+trial|try\s+(for\s+)?free|try\s+it\s+free|start\s+free|register(\s+now)?|join(\s+now|\s+free)?|open\s+an?\s+account)$/i
  return labels.some((l) => rx.test(l.trim()))
}

function detectLoginPath(paths: string[]): boolean {
  const loginPaths = ["/login", "/log-in", "/signin", "/sign-in", "/auth/login", "/auth/signin", "/account/login", "/user/login"]
  return paths.some((p) => pathStartsWith(p, loginPaths))
}

function detectLoginLabel(labels: string[]): boolean {
  const rx = /^(log\s*in|sign\s+in|log\s+in\s+to\s+your\s+account|my\s+account|account\s+login)$/i
  return labels.some((l) => rx.test(l.trim()))
}

// Checkout = real cart infrastructure, not just a portfolio mention of the word
function detectCheckoutPath(paths: string[]): boolean {
  const cartPaths = ["/cart", "/bag", "/basket", "/checkout"]
  return paths.some((p) => pathStartsWith(p, cartPaths))
}

function detectProductCatalogPath(paths: string[]): boolean {
  const catalogPaths = ["/products", "/product", "/collections", "/collection", "/shop", "/store", "/catalogue", "/catalog"]
  // Require at least two distinct catalog-style paths OR one with a slug-like structure
  const matches = paths.filter((p) => pathStartsWith(p, catalogPaths))
  // A single /shop link is weak (could be a portfolio link). Require either a deep path or multiple catalog paths.
  return (
    matches.some((p) => p.split("/").filter(Boolean).length >= 2) ||
    matches.length >= 2
  )
}

function detectCheckoutButton(labels: string[]): boolean {
  const rx = /^(add\s+to\s+(cart|bag|basket)|buy\s+now|buy|checkout|view\s+(cart|bag|basket)|go\s+to\s+(cart|checkout)|order\s+now|purchase|shop\s+now|add\s+to\s+order)$/i
  return labels.some((l) => rx.test(l.trim()))
}

// Visible text checks — applied only to inert-stripped content
function visibleTextIncludes(visibleText: string, tokens: string[]): boolean {
  return tokens.some((token) => visibleText.includes(token))
}

// ---------------------------------------------------------------------------
// Extended quality and business-type signals
// ---------------------------------------------------------------------------

function detectMobileViewport(rawHtml: string): boolean {
  return /<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*/i.test(rawHtml)
}

function detectContactOrBookingPath(paths: string[], labels: string[]): boolean {
  const contactPaths = [
    "/contact", "/contact-us", "/get-in-touch", "/reach-us",
    "/book", "/book-a-call", "/book-a-demo", "/book-a-meeting",
    "/schedule", "/schedule-a-call", "/schedule-a-demo",
    "/get-a-quote", "/request-quote", "/request-a-demo", "/request-a-consultation",
    "/demo", "/get-demo", "/hire-us", "/work-with-us", "/lets-talk",
    "/inquiry", "/enquiry",
  ]
  const rx = /^(contact(\s+us)?|get\s+in\s+touch|book\s+a\s+(call|demo|meeting)|schedule(\s+a\s+(call|demo))?|request\s+a\s+(demo|quote|consultation)|get\s+a\s+quote|start\s+a\s+project|hire\s+us|work\s+with\s+us|talk\s+to\s+(us|sales)|let'?s\s+talk|get\s+a\s+demo|speak\s+to\s+(us|sales))$/i
  return (
    paths.some((p) => contactPaths.some((cp) => p === cp || p.startsWith(`${cp}/`))) ||
    labels.some((l) => rx.test(l.trim()))
  )
}

function detectAgencyLanguage(visibleText: string, labels: string[]): boolean {
  const lower = visibleText.toLowerCase()
  const textTokens = [
    "agency",
    "studio",
    "client work",
    "case studies",
    "portfolio",
    "our work",
    "creative partner",
    "growth partner",
    "digital product studio",
    "brand strategy",
    "web design",
    "development agency",
  ]
  const labelRx = /^(start\s+a\s+project|view\s+our\s+work|see\s+our\s+work|work\s+with\s+us|hire\s+us|book\s+a\s+call|schedule\s+a\s+call|request\s+a\s+quote|let'?s\s+talk)$/i
  return textTokens.some((token) => lower.includes(token)) || labels.some((label) => labelRx.test(label.trim()))
}

function detectServiceLanguage(visibleText: string, labels: string[]): boolean {
  const lower = visibleText.toLowerCase()
  const textTokens = [
    "services",
    "consulting",
    "consultation",
    "client",
    "clients",
    "project",
    "quote",
    "proposal",
    "book a call",
    "schedule a call",
    "contact us",
    "get in touch",
  ]
  const labelRx = /^(contact(\s+us)?|get\s+in\s+touch|start\s+a\s+project|request\s+a\s+quote|book\s+a\s+call|schedule\s+a\s+call|work\s+with\s+us|hire\s+us|let'?s\s+talk)$/i
  return textTokens.some((token) => lower.includes(token)) || labels.some((label) => labelRx.test(label.trim()))
}

function detectAppDashboardLanguage(visibleText: string): boolean {
  // Only trigger on signals that are contextually SaaS -- not generic tech terms.
  // "app", "platform", "workflow", "integrations" are mentioned by agencies constantly
  // when describing what they build for clients. Require specific user-account context.
  return visibleTextIncludes(visibleText.toLowerCase(), [
    "your dashboard",
    "open the app",
    "go to dashboard",
    "free trial",
    "start your free trial",
    "upgrade your plan",
    "cancel anytime",
    "saas",
  ])
}

function detectSubscriptionLanguage(visibleText: string): boolean {
  const lower = visibleText.toLowerCase()
  // Require pricing-adjacent subscription language, not just the word "subscription".
  // Agencies frequently say "subscription services", "monthly retainer", "recurring revenue"
  // when describing client work. These are not SaaS signals.
  const tokens = [
    "per month", "/month", "per year", "/year", "/mo",
    "billed monthly", "billed annually",
    "cancel anytime",
    "upgrade your plan",
    "free tier",
    "start your free trial",
    "try for free",
    "saas",
    "mrr",
    "arr",
  ]
  return tokens.some((t) => lower.includes(t))
}

// Lead-gen CTA labels that definitively indicate a service or agency business model.
// A site whose primary action is one of these is seeking inbound leads, not self-serve signups.
const LEAD_GEN_CTA_RX =
  /^(start\s+a\s+project|book\s+a\s+(call|demo|meeting)|schedule\s+a\s+(call|demo|meeting)|request\s+a\s+(quote|consultation|proposal)|contact(\s+us)?|get\s+in\s+touch|work\s+with\s+us|hire\s+us|let'?s\s+talk|talk\s+to\s+us|discuss\s+your\s+project|see\s+how\s+we\s+can\s+help|get\s+a\s+quote|send\s+us\s+a\s+message|drop\s+us\s+a\s+line)$/i

function classifyBusinessType(input: {
  surfaceClassification: UrlSourceSurfaceClassificationV1
  hasCheckoutSignal: boolean
  hasSignupPath: boolean
  hasLoginPath: boolean
  hasPricingPath: boolean
  hasContactOrBookingPath: boolean
  hasSubscriptionLanguage: boolean
  hasAgencyLanguage: boolean
  hasServiceLanguage: boolean
  hasAppDashboardLanguage: boolean
  primaryCtaLabel: string | null
}): UrlSourceBusinessTypeV1 {
  const primaryCta = input.primaryCtaLabel?.toLowerCase().trim() ?? ""
  const isLeadGenCta = LEAD_GEN_CTA_RX.test(primaryCta)

  // Self-serve infrastructure: the minimum required to be a SaaS.
  // Without at least one of these, a site cannot be classified as SaaS
  // regardless of vocabulary signals.
  const hasSelfServeInfra =
    input.hasSignupPath ||
    input.hasLoginPath ||
    (input.hasPricingPath && input.hasSubscriptionLanguage)

  // Hard rule: if the primary CTA is a lead-gen CTA and there is no self-serve
  // infrastructure, this is definitively a service or agency business.
  // This prevents JS-rendered sites whose static HTML lacks agency vocabulary
  // from being misclassified as SaaS because of noisy signals.
  if (isLeadGenCta && !hasSelfServeInfra) {
    return input.hasAgencyLanguage ? "agency" : "service_business"
  }

  // Weighted scoring — runs when the hard rule does not fire.
  let ecommerceScore = 0
  let saasScore = 0
  let serviceScore = 0
  let agencyScore = 0

  // Ecommerce: requires real transaction infrastructure
  if (input.surfaceClassification === "ecommerce") ecommerceScore += 5
  if (input.hasCheckoutSignal) ecommerceScore += 5
  if (input.hasContactOrBookingPath && !input.hasCheckoutSignal) ecommerceScore -= 3

  // SaaS: requires actual self-serve infrastructure — vocabulary alone is not enough.
  // Without signup/login/pricing, saasScore stays at or below 2.
  if (input.hasSignupPath) saasScore += 6
  if (input.hasLoginPath) saasScore += 5
  if (input.hasPricingPath && hasSelfServeInfra) saasScore += 4
  if (input.surfaceClassification === "app_first") saasScore += 4
  // Subscription language is only meaningful when combined with self-serve infra.
  if (input.hasSubscriptionLanguage && hasSelfServeInfra) saasScore += 3
  // App/dashboard vocabulary is weak even with infra — it signals nothing by itself.
  if (input.hasAppDashboardLanguage && hasSelfServeInfra) saasScore += 1

  // Service / Agency: contact, project, portfolio signals
  if (input.hasContactOrBookingPath) serviceScore += 4
  if (input.hasServiceLanguage) serviceScore += 3
  if (isLeadGenCta) serviceScore += 5
  if (input.hasAgencyLanguage) agencyScore += 6
  if (isLeadGenCta) agencyScore += 3

  // If there is no self-serve infra and there are positive service signals,
  // further suppress saasScore to prevent weak SaaS vocabulary from winning.
  if (!hasSelfServeInfra && (serviceScore > 0 || agencyScore > 0)) {
    saasScore = Math.min(saasScore, 2)
  }

  const leadScore = Math.max(serviceScore, agencyScore)

  // Mixed: two different strong models both score >= 4
  const strongModels = [ecommerceScore, saasScore, leadScore].filter((s) => s >= 4)
  if (strongModels.length >= 2) return "mixed"

  // Single dominant model
  if (ecommerceScore >= 4 && ecommerceScore >= saasScore && ecommerceScore >= leadScore) return "ecommerce"
  if (saasScore >= 4 && saasScore >= leadScore) return "saas"
  if (agencyScore >= 4 && agencyScore >= serviceScore) return "agency"
  if (serviceScore >= 4) return "service_business"

  // Weak signal fallback: use vocabulary hints
  if (input.hasAgencyLanguage) return "agency"
  if (input.hasServiceLanguage || input.hasContactOrBookingPath) return "service_business"

  return "unknown"
}

function deriveRevenueModel(input: {
  businessType: UrlSourceBusinessTypeV1
  hasCheckoutSignal: boolean
  hasSignupPath: boolean
  hasContactOrBookingPath: boolean
}): UrlSourceRevenueModelV1 {
  if (input.businessType === "mixed") return "hybrid"
  if (input.businessType === "ecommerce" || input.hasCheckoutSignal) return "checkout"
  if (input.businessType === "saas" && input.hasSignupPath) return "self_serve_signup"
  if (
    input.businessType === "agency" ||
    input.businessType === "service_business" ||
    input.hasContactOrBookingPath
  ) {
    return "lead_generation"
  }
  return "unknown"
}

// ---------------------------------------------------------------------------
// Primary CTA scoring — position-weighted, intent-calibrated
// ---------------------------------------------------------------------------

interface CtaCandidate {
  label: string
  score: number
  position: number
}

function scorePrimaryCtaLabel(label: string): number {
  const lower = label.toLowerCase().trim()
  if (!lower || lower.length > 60) return 0

  let score = 0

  // Highest intent: product-led growth and direct purchase
  if (/^(get started|get started free|start for free|start free trial|try for free|try it free|start your free trial|start my free trial|claim your free trial|begin free trial)$/.test(lower)) score += 6
  if (/^(sign up|sign up free|sign up for free|create (an? )?account|create (a )?free account|create your account|register now|join free|join today)$/.test(lower)) score += 5
  if (/^(buy now|buy|shop now|add to cart|add to bag|checkout|order now|purchase|get (it )?now)$/.test(lower)) score += 5
  if (/^(book a demo|book demo|request a demo|request demo|schedule a demo|see a demo|watch a demo|get a demo)$/.test(lower)) score += 4
  if (/^(start|try|subscribe|get access|get (early )?access|join the waitlist|join waitlist|request access)$/.test(lower)) score += 3
  if (/^(contact us|get in touch|talk to (us|sales)|speak to (us|sales)|start a project|hire us|work with us|let's talk|let's work together)$/.test(lower)) score += 2

  // Low intent navigation CTAs — penalize these
  if (/^(learn more|read more|see more|view more|find out more|discover more|explore|see (all|how)|know more)$/.test(lower)) score -= 2
  if (/^(back|next|continue|close|cancel|skip|dismiss|ok|okay|yes|no)$/.test(lower)) score -= 2

  // Length penalty for very short (likely icon buttons) and very long labels
  if (lower.length <= 2) score -= 2
  if (lower.length >= 50) score -= 1

  return score
}

function selectPrimaryCta(
  links: Array<{ href: string; label: string }>,
  buttonLabels: string[]
): string | null {
  const candidates: CtaCandidate[] = []

  links.forEach((link, index) => {
    if (!link.label) return
    const score = scorePrimaryCtaLabel(link.label)
    if (score > 0) candidates.push({ label: link.label, score, position: index })
  })

  buttonLabels.forEach((label, index) => {
    const score = scorePrimaryCtaLabel(label)
    if (score > 0) candidates.push({ label, score, position: links.length + index })
  })

  if (!candidates.length) return null

  // Sort by score descending, then by position ascending (earlier = more prominent)
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.position - b.position
  })

  return candidates[0]?.label ?? null
}

// ---------------------------------------------------------------------------
// Surface classification
// ---------------------------------------------------------------------------

function classifySurface(input: {
  hasCheckoutPath: boolean
  hasProductCatalog: boolean
  hasCheckoutButton: boolean
  hasSignupPath: boolean
  hasLoginPath: boolean
  hasPricingPath: boolean
  hasPrimaryCta: boolean
  visibleBodyText: string
}): UrlSourceSurfaceClassificationV1 {
  // Ecommerce requires real cart/product infrastructure, not just mentions
  const ecommerceStrong = input.hasCheckoutPath
  const ecommerceModerate =
    input.hasProductCatalog && (input.hasCheckoutButton || input.hasCheckoutPath)

  // App-first: signup or login + product/SaaS vocabulary in visible text
  const appVocab = visibleTextIncludes(input.visibleBodyText.toLowerCase(), [
    "dashboard", "workspace", "your account", "manage your", "free trial",
    "saas", "platform", "onboarding", "workflow", "integrations",
  ])
  const appStrong = (input.hasSignupPath || input.hasLoginPath) && appVocab
  const appModerate = input.hasSignupPath && input.hasLoginPath

  const isEcommerce = ecommerceStrong || ecommerceModerate
  const isApp = appStrong || appModerate

  if (isEcommerce && isApp) return "mixed"
  if (isEcommerce) return "ecommerce"
  if (isApp) return "app_first"
  if (input.hasPrimaryCta || input.hasPricingPath || input.hasSignupPath) return "marketing_only"
  return "unknown"
}

function deriveRevenuePathClarity(input: {
  hasPricingPath: boolean
  hasSignupPath: boolean
  hasCheckoutSignal: boolean
  hasContactOrBookingPath: boolean
  hasPrimaryCta: boolean
  surfaceClassification: UrlSourceSurfaceClassificationV1
  businessType: UrlSourceBusinessTypeV1
}): UrlSourceRevenuePathClarityV1 {
  // Clear: actual transaction infrastructure or full funnel visible
  if (input.hasCheckoutSignal) return "clear"
  if (input.hasPricingPath && (input.hasSignupPath || input.hasPrimaryCta)) return "clear"
  if (
    (input.businessType === "agency" || input.businessType === "service_business") &&
    input.hasContactOrBookingPath &&
    input.hasPrimaryCta
  ) {
    return "clear"
  }

  // Partial: some signals but not a complete funnel
  if (input.hasPricingPath || input.hasSignupPath) return "partial"
  if (input.hasContactOrBookingPath) return "partial"
  if (input.hasPrimaryCta && input.surfaceClassification !== "unknown") return "partial"

  return "none"
}

// ---------------------------------------------------------------------------
// Evidence rows
// ---------------------------------------------------------------------------

function buildEvidenceRows(input: {
  classification: UrlSourceSurfaceClassificationV1
  revenuePathClarity: UrlSourceRevenuePathClarityV1
  hasPricingPath: boolean
  hasSignupPath: boolean
  hasLoginPath: boolean
  hasPrimaryCta: boolean
  primaryCtaLabel: string | null
  hasCheckoutSignal: boolean
  businessType: UrlSourceBusinessTypeV1
  revenueModel: UrlSourceRevenueModelV1
  hasContactOrBookingPath: boolean
  hasSubscriptionLanguage: boolean
  finalUrl: string | null
  httpStatus: number | null
}): Array<{ label: string; value: string }> {
  return [
    { label: "Business model", value: input.businessType },
    { label: "Revenue model", value: input.revenueModel },
    { label: "Surface classification", value: input.classification },
    { label: "Revenue path clarity", value: input.revenuePathClarity },
    { label: "Pricing path detected", value: input.hasPricingPath ? "yes" : "no" },
    { label: "Signup path detected", value: input.hasSignupPath ? "yes" : "no" },
    { label: "Login path detected", value: input.hasLoginPath ? "yes" : "no" },
    { label: "Primary CTA detected", value: input.hasPrimaryCta ? "yes" : "no" },
    { label: "Primary CTA label", value: input.primaryCtaLabel ?? "none" },
    { label: "Checkout or cart signal", value: input.hasCheckoutSignal ? "yes" : "no" },
    { label: "Contact or booking path", value: input.hasContactOrBookingPath ? "yes" : "no" },
    { label: "Subscription language", value: input.hasSubscriptionLanguage ? "yes" : "no" },
    { label: "Final URL", value: input.finalUrl ?? "none" },
    { label: "HTTP status", value: input.httpStatus !== null ? String(input.httpStatus) : "unknown" },
  ]
}

// ---------------------------------------------------------------------------
// Failed result
// ---------------------------------------------------------------------------

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
      businessType: "unknown",
      revenueModel: "unknown",
      hasMobileViewport: false,
      hasContactOrBookingPath: false,
      hasSubscriptionLanguage: false,
      responseTimeMs: null,
    },
    evidenceRows: [
      { label: "Runner status", value: "failed" },
      { label: "Failure reason", value: input.message },
    ],
    errorMessage: input.message,
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

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
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)
  const fetchStart = Date.now()
  try {
    response = await fetch(normalizedEntryUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "CheckoutLeakUrlSourceRunner/2.0 (+https://checkoutleak.com)",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
    })
  } catch (error) {
    clearTimeout(timeoutId)
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Request timed out after 15 seconds."
          : error.message
        : String(error)
    return buildFailedResult({
      runId: input.runId,
      entryUrl: normalizedEntryUrl,
      startedAt,
      message,
    })
  }
  clearTimeout(timeoutId)
  const responseTimeMs = Date.now() - fetchStart

  const finalUrl = response.url || normalizedEntryUrl
  const httpStatus = response.status
  const rawHtml = await response.text().catch(() => "")

  // Derive the base origin for resolving relative hrefs
  let baseOrigin: string
  try {
    baseOrigin = new URL(finalUrl).origin
  } catch {
    baseOrigin = new URL(normalizedEntryUrl).origin ?? ""
  }

  // Strip inert content (scripts, styles, SVGs, comments) before any text analysis.
  // This is the single most important step — JS code contains e-commerce variable
  // names, API route strings, and template literals that poison naive text scanning.
  const visibleHtml = stripInertContent(rawHtml)
  const visibleBodyText = cleanWhitespace(stripHtmlTags(visibleHtml))

  // Extract navigable links from visible HTML only
  const navLinks = extractNavLinks(visibleHtml)
  const buttonLabels = extractButtonLabels(visibleHtml)
  const allLabels = [
    ...navLinks.map((l) => l.label).filter(Boolean),
    ...buttonLabels,
  ]

  // Build pathname list for structural signal detection
  const navPaths = navLinks
    .map((l) => extractPathname(l.href, baseOrigin))
    .filter((p): p is string => p !== null)

  // --- Pricing ---
  // Requires a dedicated pricing page URL or an explicit navigation label.
  // Body text is NOT used — agencies and service sites say "pricing" constantly.
  const hasPricingPath =
    detectPricingPath(navPaths) || detectPricingLabel(allLabels)

  // --- Signup ---
  // Requires either a signup URL path or a specific call-to-action label.
  const hasSignupPath =
    detectSignupPath(navPaths) || detectSignupLabel(allLabels)

  // --- Login ---
  const hasLoginPath =
    detectLoginPath(navPaths) || detectLoginLabel(allLabels)

  // --- Checkout / Cart ---
  // Requires actual cart infrastructure. /shop alone is not sufficient because
  // agency and portfolio sites frequently link to their clients' shops.
  const hasCheckoutPath = detectCheckoutPath(navPaths)
  const hasProductCatalog = detectProductCatalogPath(navPaths)
  const hasCheckoutButton = detectCheckoutButton(allLabels)
  const hasCheckoutSignal =
    hasCheckoutPath || (hasProductCatalog && hasCheckoutButton) || hasCheckoutButton

  // --- Extended quality and business-type signals ---
  const hasMobileViewport = detectMobileViewport(rawHtml)
  const hasContactOrBookingPath = detectContactOrBookingPath(navPaths, allLabels)
  const hasSubscriptionLanguage = detectSubscriptionLanguage(visibleBodyText)
  const hasAgencyLanguage = detectAgencyLanguage(visibleBodyText, allLabels)
  const hasServiceLanguage = detectServiceLanguage(visibleBodyText, allLabels)
  const hasAppDashboardLanguage = detectAppDashboardLanguage(visibleBodyText)

  // --- Primary CTA ---
  const primaryCtaLabel = selectPrimaryCta(navLinks, buttonLabels)
  const hasPrimaryCta = primaryCtaLabel !== null

  // --- Classification and clarity ---
  const surfaceClassification = classifySurface({
    hasCheckoutPath,
    hasProductCatalog,
    hasCheckoutButton,
    hasSignupPath,
    hasLoginPath,
    hasPricingPath,
    hasPrimaryCta,
    visibleBodyText,
  })

  const businessType = classifyBusinessType({
    surfaceClassification,
    hasCheckoutSignal,
    hasSignupPath,
    hasLoginPath,
    hasPricingPath,
    hasContactOrBookingPath,
    hasSubscriptionLanguage,
    hasAgencyLanguage,
    hasServiceLanguage,
    hasAppDashboardLanguage,
    primaryCtaLabel,
  })

  const revenueModel = deriveRevenueModel({
    businessType,
    hasCheckoutSignal,
    hasSignupPath,
    hasContactOrBookingPath,
  })

  const revenuePathClarity = deriveRevenuePathClarity({
    hasPricingPath,
    hasSignupPath,
    hasCheckoutSignal,
    hasContactOrBookingPath,
    hasPrimaryCta,
    surfaceClassification,
    businessType,
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
    primaryCtaLabel,
    hasCheckoutSignal,
    businessType,
    revenueModel,
    hasContactOrBookingPath,
    hasSubscriptionLanguage,
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
      primaryCtaLabel,
      hasCheckoutSignal,
      businessType,
      revenueModel,
      hasMobileViewport,
      hasContactOrBookingPath,
      hasSubscriptionLanguage,
      responseTimeMs,
    },
    evidenceRows,
    errorMessage: null,
  }
}
