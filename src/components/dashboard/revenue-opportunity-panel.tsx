import { BarChart3 } from "lucide-react"

import { formatCompactCurrency } from "@/lib/format"
import type { RevenueOpportunity } from "@/types/domain"

const confidenceLabel: Record<RevenueOpportunity["confidence"], string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
}

export function RevenueOpportunityPanel({
  opportunities,
}: {
  opportunities: RevenueOpportunity[]
}) {
  const maxImpact = Math.max(
    ...opportunities.map((opportunity) => opportunity.estimatedMonthlyRevenueImpact)
  )

  return (
    <section className="surface-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Revenue Opportunity</h3>
        <BarChart3 className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-5 space-y-4">
        {opportunities.map((opportunity) => {
          const width = Math.max(
            (opportunity.estimatedMonthlyRevenueImpact / maxImpact) * 100,
            12
          )

          return (
            <div key={opportunity.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{opportunity.label}</span>
                <span className="font-semibold text-primary">
                  {formatCompactCurrency(opportunity.estimatedMonthlyRevenueImpact)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-primary/85 transition-[width] duration-500"
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {confidenceLabel[opportunity.confidence]}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
