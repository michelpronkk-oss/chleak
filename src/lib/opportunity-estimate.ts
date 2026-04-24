import { formatCompactCurrency } from "@/lib/format"

export type OpportunityConfidence = "low" | "moderate" | "high"

export interface OpportunityEstimate {
  label: string
  detail: string
  leadsMeta: string | null  // concise leads/unit context, e.g. "1-3 missed leads/month"
  confidence: OpportunityConfidence
  reason: string
  estimatedLow: number | null
  estimatedHigh: number | null
}

function roundToHundreds(value: number) {
  return Math.round(value / 100) * 100
}

function estimateRange(input: {
  base: number
  revenuePathClarity: string | null | undefined
  hasEvidenceBackedFinding: boolean
}) {
  const multiplier =
    input.revenuePathClarity === "none"
      ? 1.35
      : input.revenuePathClarity === "partial"
        ? 1
        : 0.7
  const low = Math.max(300, roundToHundreds(input.base * multiplier * 0.6))
  const high = Math.max(low + 600, roundToHundreds(input.base * multiplier * 1.7))
  const confidence: OpportunityConfidence = input.hasEvidenceBackedFinding
    ? "moderate"
    : input.revenuePathClarity === "clear"
      ? "low"
      : "low"

  return { low, high, confidence }
}

export function getDirectionalOpportunityEstimate(input: {
  businessType: string | null | undefined
  revenueModel?: string | null | undefined
  revenuePathClarity?: string | null | undefined
  issueImpact?: number | null | undefined
  issueCount?: number | null | undefined
  hasScreenshotEvidence?: boolean
}): OpportunityEstimate {
  const hasIssueSignal = (input.issueImpact ?? 0) > 0 || (input.issueCount ?? 0) > 0
  const hasEvidenceBackedFinding = hasIssueSignal || input.hasScreenshotEvidence === true

  if (input.businessType === "agency" || input.businessType === "service_business") {
    const base = input.issueImpact && input.issueImpact > 0 ? input.issueImpact : 2400
    const range = estimateRange({
      base,
      revenuePathClarity: input.revenuePathClarity,
      hasEvidenceBackedFinding,
    })
    const missedLeadLow = 1
    const missedLeadHigh = range.high >= 6000 ? 4 : 3
    return {
      label: "Pipeline opportunity",
      detail: `${missedLeadLow}-${missedLeadHigh} missed leads/month`,
      leadsMeta: `${missedLeadLow}-${missedLeadHigh} missed leads/month`,
      confidence: range.confidence,
      reason: hasEvidenceBackedFinding
        ? "Directional. Based on lead path evidence and surface analysis."
        : "Directional. Based on lead-generation model and visible revenue path signals.",
      estimatedLow: range.low,
      estimatedHigh: range.high,
    }
  }

  if (input.businessType === "saas") {
    const base = input.issueImpact && input.issueImpact > 0 ? input.issueImpact : 1500
    const range = estimateRange({
      base,
      revenuePathClarity: input.revenuePathClarity,
      hasEvidenceBackedFinding,
    })
    return {
      label: "Signup opportunity",
      detail: "3-12 missed signups/month",
      leadsMeta: "3-12 missed signups/month",
      confidence: range.confidence,
      reason: hasEvidenceBackedFinding
        ? "Directional. Based on signup, pricing, or activation path signals."
        : "Directional. SaaS surface detected without full conversion evidence.",
      estimatedLow: range.low,
      estimatedHigh: range.high,
    }
  }

  if (input.businessType === "ecommerce") {
    const base = input.issueImpact && input.issueImpact > 0 ? input.issueImpact : 1800
    const range = estimateRange({
      base,
      revenuePathClarity: input.revenuePathClarity,
      hasEvidenceBackedFinding,
    })
    return {
      label: "Checkout opportunity",
      detail: "Potential checkout conversion upside",
      leadsMeta: null,
      confidence: range.confidence,
      reason: hasEvidenceBackedFinding
        ? "Directional. Based on checkout, cart, or mobile conversion evidence."
        : "Directional. Ecommerce surface detected without transaction evidence.",
      estimatedLow: range.low,
      estimatedHigh: range.high,
    }
  }

  if (input.businessType === "mixed") {
    const base = input.issueImpact && input.issueImpact > 0 ? input.issueImpact : 1600
    const range = estimateRange({
      base,
      revenuePathClarity: input.revenuePathClarity,
      hasEvidenceBackedFinding,
    })
    return {
      label: "Directional opportunity",
      detail: "Mixed revenue-path signals detected",
      leadsMeta: null,
      confidence: range.confidence,
      reason: "Based on mixed revenue-path signals from the primary source.",
      estimatedLow: range.low,
      estimatedHigh: range.high,
    }
  }

  return {
    label: "More signal needed",
    detail: "Run analysis to estimate opportunity",
    leadsMeta: null,
    confidence: "low",
    reason: "Run analysis or connect relevant evidence systems before estimating.",
    estimatedLow: null,
    estimatedHigh: null,
  }
}
