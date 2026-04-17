import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"

import { formatCompactCurrency } from "@/lib/format"
import type { Issue } from "@/types/domain"

const confidenceBySeverity: Record<Issue["severity"], string> = {
  critical: "Strong signal",
  high: "High confidence",
  medium: "Medium confidence",
  low: "Emerging signal",
}

export function DecisionBanner({
  issue,
  fixPlanHref,
}: {
  issue: Issue
  fixPlanHref: string
}) {
  return (
    <section className="surface-card-strong overflow-hidden p-6 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-end">
        <div className="space-y-3">
          <p className="data-mono text-primary">Primary Leak Decision</p>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {issue.title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            {issue.whyItMatters}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-md border border-primary/35 bg-primary/10 px-2 py-1 text-primary">
              {confidenceBySeverity[issue.severity]}
            </span>
            <span className="rounded-md border border-border/70 px-2 py-1 text-muted-foreground">
              Severity: {issue.severity}
            </span>
            <span className="rounded-md border border-border/70 px-2 py-1 text-muted-foreground">
              Source: {issue.source}
            </span>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border/70 bg-background/35 p-4 sm:p-5">
          <p className="data-mono text-muted-foreground">At Risk Monthly</p>
          <p className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            {formatCompactCurrency(issue.estimatedMonthlyRevenueImpact)}
          </p>
          <p className="text-sm text-muted-foreground">{issue.recommendedAction}</p>
          <Link
            href={fixPlanHref}
            className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Fix this issue
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Decision confidence: {confidenceBySeverity[issue.severity]}
          </p>
        </div>
      </div>
    </section>
  )
}
