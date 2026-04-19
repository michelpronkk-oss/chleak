import Link from "next/link"
import { ArrowRight, ShieldCheck } from "lucide-react"

import {
  MetaPill,
  SeverityPill,
  cleanPrimaryCopy,
  formatImpactLabel,
  formatSourceLabel,
  getSeverityConfidence,
} from "@/components/dashboard/vault-primitives"
import type { Issue } from "@/types/domain"

export function DecisionBanner({
  issue,
  fixPlanHref,
}: {
  issue: Issue
  fixPlanHref: string
}) {
  return (
    <section className="surface-card-strong overflow-hidden p-4 sm:p-6 lg:p-7">
      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr] lg:items-end">
        <div className="space-y-2.5">
          <p className="data-mono text-primary">Primary Leak Decision</p>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
            {issue.title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem] sm:leading-7">
            {cleanPrimaryCopy(issue.whyItMatters)}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <SeverityPill severity={issue.severity} />
            <MetaPill>Confidence: {getSeverityConfidence(issue.severity)}</MetaPill>
            <MetaPill>Source: {formatSourceLabel(issue.source)}</MetaPill>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border/70 bg-background/35 p-4 sm:p-5">
          <p className="data-mono text-muted-foreground">At Risk Monthly</p>
          <p className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
            {formatImpactLabel(issue.estimatedMonthlyRevenueImpact)}
          </p>
          <p className="text-sm text-muted-foreground">{cleanPrimaryCopy(issue.recommendedAction)}</p>
          <Link
            href={fixPlanHref}
            className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
          >
            Review action brief
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Decision confidence: {getSeverityConfidence(issue.severity)}
          </p>
        </div>
      </div>
    </section>
  )
}
