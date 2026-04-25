import { createSupabaseAdminClient } from "@/lib/supabase/shared"

export interface PublicReportData {
  token: string
  label: string | null
  expiresAt: string
  store: {
    name: string
    domain: string | null
    platform: string
  }
  scan: {
    id: string
    scannedAt: string
    completedAt: string | null
    detectedIssuesCount: number
  } | null
  analysis: {
    businessType: string | null
    revenueModel: string | null
    revenuePathClarity: string | null
    surfaceClassification: string | null
    primaryCtaLabel: string | null
    hasPricingPath: boolean
    hasSignupPath: boolean
    hasCheckoutSignal: boolean
    hasContactOrBookingPath: boolean
    hasMobileViewport: boolean
    // SEO
    metaTitle: string | null
    metaTitleQuality: string | null
    metaDescription: string | null
    metaDescriptionQuality: string | null
    h1Count: number | null
    hasOpenGraph: boolean
    hasStructuredData: boolean
    hasFaqSchema: boolean
    geoReadinessScore: number | null
    structuredDataTypes: string[]
    // Browser
    lcpMs: number | null
    lcpRating: string | null
    clsScore: number | null
    clsRating: string | null
    mobileViewportOverflow: boolean
    mobileH1IsOversized: boolean
    mobileScreenshotRef: string | null
    desktopScreenshotRef: string | null
    responseTimeMs: number | null
    hasAiGenericCopy: boolean
  } | null
  issues: Array<{
    id: string
    title: string
    summary: string
    severity: string
    type: string
    estimatedMonthlyRevenueImpact: number
  }>
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null
}

function asBoolean(v: unknown): boolean {
  return v === true
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string")
}

export async function getPublicReportData(
  token: string
): Promise<PublicReportData | null> {
  const admin = createSupabaseAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenResult = await (admin as any)
    .from("report_tokens")
    .select("id, token, label, expires_at, store_id, scan_id, organization_id")
    .eq("token", token)
    .maybeSingle()

  if (tokenResult.error || !tokenResult.data) return null

  const row = tokenResult.data
  if (new Date(row.expires_at) < new Date()) return null

  const [storeResult, issuesResult, integrationResult] = await Promise.all([
    admin
      .from("stores")
      .select("name, domain, platform")
      .eq("id", row.store_id)
      .single(),
    admin
      .from("issues")
      .select("id, title, summary, severity, type, estimated_monthly_revenue_impact")
      .eq("store_id", row.store_id)
      .eq("organization_id", row.organization_id)
      .neq("status", "resolved")
      .order("estimated_monthly_revenue_impact", { ascending: false })
      .limit(10),
    admin
      .from("store_integrations")
      .select("metadata")
      .eq("store_id", row.store_id)
      .eq("provider", "checkoutleak_connector")
      .neq("status", "disconnected")
      .order("installed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const store = storeResult.data
  if (!store) return null

  let scan: PublicReportData["scan"] = null
  if (row.scan_id) {
    const scanResult = await admin
      .from("scans")
      .select("id, scanned_at, completed_at, detected_issues_count")
      .eq("id", row.scan_id)
      .maybeSingle()
    if (scanResult.data) {
      scan = {
        id: scanResult.data.id,
        scannedAt: scanResult.data.scanned_at,
        completedAt: scanResult.data.completed_at,
        detectedIssuesCount: scanResult.data.detected_issues_count,
      }
    }
  }

  // Extract analysis from integration metadata
  let analysis: PublicReportData["analysis"] = null
  const meta = asRecord(integrationResult.data?.metadata)
  if (meta) {
    const lastRun = asRecord(meta.url_source_analysis_last_run)
    const summary = asRecord(lastRun?.summary)
    const browserRun = asRecord(meta.url_source_browser_inspection_last_run)

    if (summary) {
      analysis = {
        businessType: asString(summary.businessType ?? summary.business_type),
        revenueModel: asString(summary.revenueModel ?? summary.revenue_model),
        revenuePathClarity: asString(summary.revenuePathClarity ?? summary.revenue_path_clarity),
        surfaceClassification: asString(summary.surfaceClassification ?? summary.surface_classification),
        primaryCtaLabel: asString(summary.primaryCtaLabel ?? summary.primary_cta_label),
        hasPricingPath: asBoolean(summary.hasPricingPath ?? summary.has_pricing_path),
        hasSignupPath: asBoolean(summary.hasSignupPath ?? summary.has_signup_path),
        hasCheckoutSignal: asBoolean(summary.hasCheckoutSignal ?? summary.has_checkout_signal),
        hasContactOrBookingPath: asBoolean(summary.hasContactOrBookingPath ?? summary.has_contact_or_booking_path),
        hasMobileViewport: asBoolean(summary.hasMobileViewport ?? summary.has_mobile_viewport),
        metaTitle: asString(summary.metaTitle ?? summary.meta_title),
        metaTitleQuality: asString(summary.metaTitleQuality ?? summary.meta_title_quality),
        metaDescription: asString(summary.metaDescription ?? summary.meta_description),
        metaDescriptionQuality: asString(summary.metaDescriptionQuality ?? summary.meta_description_quality),
        h1Count: asNumber(summary.h1Count ?? summary.h1_count),
        hasOpenGraph: asBoolean(summary.hasOpenGraph ?? summary.has_open_graph),
        hasStructuredData: asBoolean(summary.hasStructuredData ?? summary.has_structured_data),
        hasFaqSchema: asBoolean(summary.hasFaqSchema ?? summary.has_faq_schema),
        geoReadinessScore: asNumber(summary.geoReadinessScore ?? summary.geo_readiness_score),
        structuredDataTypes: asStringArray(summary.structuredDataTypes ?? summary.structured_data_types),
        responseTimeMs: asNumber(summary.responseTimeMs ?? summary.response_time_ms),
        hasAiGenericCopy: asBoolean(summary.hasAiGenericCopy ?? summary.has_ai_generic_copy),
        lcpMs: asNumber(browserRun?.lcp_ms),
        lcpRating: asString(browserRun?.lcp_rating),
        clsScore: asNumber(browserRun?.cls_score),
        clsRating: asString(browserRun?.cls_rating),
        mobileViewportOverflow: asBoolean(browserRun?.mobile_viewport_overflow),
        mobileH1IsOversized: asBoolean(browserRun?.mobile_h1_is_oversized),
        mobileScreenshotRef: asString(browserRun?.mobile_screenshot_ref),
        desktopScreenshotRef: asString(browserRun?.desktop_screenshot_ref),
      }
    }
  }

  const issues = (issuesResult.data ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    summary: i.summary,
    severity: i.severity,
    type: i.type,
    estimatedMonthlyRevenueImpact: i.estimated_monthly_revenue_impact,
  }))

  return {
    token: String(row.token),
    label: row.label ?? null,
    expiresAt: row.expires_at,
    store: {
      name: store.name,
      domain: store.domain,
      platform: store.platform,
    },
    scan,
    analysis,
    issues,
  }
}
