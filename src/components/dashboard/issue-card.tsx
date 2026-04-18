import Link from "next/link"
import { AlertTriangle, ArrowRight, CircleDot } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Issue } from "@/types/domain"

const severityStyles: Record<Issue["severity"], string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  high: "border-amber-300/40 bg-amber-300/10 text-amber-300",
  medium: "border-sky-300/40 bg-sky-300/10 text-sky-300",
  low: "border-emerald-300/40 bg-emerald-300/10 text-emerald-300",
}

const confidenceBySeverity: Record<Issue["severity"], string> = {
  critical: "Strong signal",
  high: "High confidence",
  medium: "Medium confidence",
  low: "Emerging signal",
}

function formatImpactLabel(value: number) {
  if (value > 0) {
    return formatCompactCurrency(value)
  }

  return "Impact pending"
}

function formatSourceLabel(source: string) {
  if (source.startsWith("shopify_simulation")) {
    return "shopify_monitoring"
  }

  if (source.startsWith("shopify_monitoring")) {
    return "shopify_monitoring"
  }

  return source
}

function cleanPrimaryCopy(text: string) {
  return text.replace(/^simulation:\s*/i, "")
}

export function IssueCard({
  issue,
  fixPlanHref,
}: {
  issue: Issue
  fixPlanHref: string
}) {
  return (
    <article className="surface-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-base font-semibold tracking-tight sm:text-lg">{issue.title}</p>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{issue.summary}</p>
        </div>
        <div className="space-y-1 text-left sm:text-right">
          <p className="data-mono text-muted-foreground">Monthly impact</p>
          <p className="text-xl font-semibold tracking-tight text-primary sm:text-2xl">
            {formatImpactLabel(issue.estimatedMonthlyRevenueImpact)}
          </p>
          <p className="text-xs text-muted-foreground">{confidenceBySeverity[issue.severity]}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
        <Badge className={cn("border text-[11px] uppercase", severityStyles[issue.severity])}>
          {issue.severity}
        </Badge>
        <Badge variant="outline" className="text-[11px] uppercase text-muted-foreground">
          {issue.type.replaceAll("_", " ")}
        </Badge>
        <Badge variant="outline" className="text-[11px] uppercase text-muted-foreground">
          {confidenceBySeverity[issue.severity]}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-4 border-t border-border/70 pt-3.5 sm:mt-5 sm:gap-5 sm:pt-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <dt className="data-mono text-muted-foreground">Why it matters</dt>
          <dd className="text-sm text-foreground/90">{cleanPrimaryCopy(issue.whyItMatters)}</dd>
        </div>
        <div className="space-y-1.5">
          <dt className="data-mono text-muted-foreground">Recommended action</dt>
          <dd className="text-sm text-foreground/90">{cleanPrimaryCopy(issue.recommendedAction)}</dd>
        </div>
        <div className="space-y-1.5">
          <dt className="data-mono text-muted-foreground">Source and detected</dt>
          <dd className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDot className="h-3.5 w-3.5 text-primary" />
            {formatSourceLabel(issue.source)} | {formatRelativeTimestamp(issue.detectedAt)}
          </dd>
        </div>
        <div className="space-y-1.5">
          <dt className="data-mono text-muted-foreground">Confidence</dt>
          <dd className="text-sm text-foreground/90">{confidenceBySeverity[issue.severity]}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3.5 text-xs text-muted-foreground sm:mt-4 sm:pt-4">
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
          Status: {issue.status}
        </span>
        <Link
          href={fixPlanHref}
          className="inline-flex items-center gap-1 rounded-md border border-primary/35 bg-primary/10 px-2.5 py-1.5 text-primary transition-opacity hover:opacity-85"
        >
          Review action brief <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}
