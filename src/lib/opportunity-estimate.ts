import { formatCompactCurrency } from "@/lib/format"

export type OpportunityConfidence = "low" | "moderate" | "high"

export interface OpportunityEstimate {
  label: string
  detail: string
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
    const missedLeadLow = range.confidence === "moderate" ? 1 : 1
    const missedLeadHigh = range.high >= 6000 ? 4 : 3
    return {
      label: "Estimated pipeline opportunity",
      detail: `${missedLeadLow} to ${missedLeadHigh} missed leads/month, ${formatCompactCurrency(range.low)} to ${formatCompactCurrency(range.high)} pipeline`,
      confidence: range.confidence,
      reason: hasEvidenceBackedFinding
        ? "Based on the detected lead path issue and captured surface evidence."
        : "Based on detected lead-generation model and visible revenue path signals.",
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
      label: "Estimated signup upside",
      detail: `3 to 12 missed signups/month, ${formatCompactCurrency(range.low)} to ${formatCompactCurrency(range.high)} MRR`,
      confidence: range.confidence,
      reason: hasEvidenceBackedFinding
        ? "Based on the detected signup, pricing, or activation path issue."
        : "Based on SaaS surface signals without enough conversion evidence for higher confidence.",
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
      label: "Estimated checkout leakage",
      detail: `${formatCompactCurrency(range.low)} to ${formatCompactCurrency(range.high)} / month potential checkout leakage`,
      confidence: range.confidence,
      reason: hasEvidenceBackedFinding
        ? "Based on checkout, cart, payment, or mobile conversion evidence."
        : "Based on ecommerce surface signals without enough transaction evidence for higher confidence.",
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
      detail: `${formatCompactCurrency(range.low)} to ${formatCompactCurrency(range.high)} / month potential upside`,
      confidence: range.confidence,
      reason: "Based on mixed revenue-path signals from the primary source.",
      estimatedLow: range.low,
      estimatedHigh: range.high,
    }
  }

  return {
    label: "Opportunity not estimated yet",
    detail: "More signal needed",
    confidence: "low",
    reason: "Run analysis or connect relevant evidence systems before estimating opportunity.",
    estimatedLow: null,
    estimatedHigh: null,
  }
}
