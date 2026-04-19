import type { ReactNode } from "react"
import { Clock3 } from "lucide-react"

import { formatCompactCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { IssueSeverity, ScanStatus, SuggestedAction } from "@/types/domain"

const confidenceBySeverity: Record<IssueSeverity, string> = {
  critical: "Strong signal",
  high: "High confidence",
  medium: "Medium confidence",
  low: "Emerging signal",
}

const severityPillStyles: Record<IssueSeverity, string> = {
  critical: "border-[color:var(--sev-critical)]/35 bg-[color:var(--sev-critical-bg)] text-[color:var(--sev-critical)]",
  high: "border-[color:var(--sev-high)]/35 bg-[color:var(--sev-high-bg)] text-[color:var(--sev-high)]",
  medium: "border-[color:var(--sev-medium)]/35 bg-[color:var(--sev-medium-bg)] text-[color:var(--sev-medium)]",
  low: "border-[color:var(--sev-low)]/35 bg-[color:var(--sev-low-bg)] text-[color:var(--sev-low)]",
}

const severityStripeStyles: Record<IssueSeverity, string> = {
  critical: "bg-[color:var(--sev-critical)]",
  high: "bg-[color:var(--sev-high)]",
  medium: "bg-[color:var(--sev-medium)]",
  low: "bg-[color:var(--sev-low)]",
}

const scanStateStyles: Record<ScanStatus, string> = {
  queued: "border-[color:var(--info)]/35 bg-[color:var(--info-bg)] text-[color:var(--info)]",
  running: "border-[color:var(--signal-line)] bg-[color:var(--signal-dim)] text-[color:var(--signal)]",
  completed: "border-[color:var(--ok)]/35 bg-[color:var(--ok-bg)] text-[color:var(--ok)]",
  failed: "border-[color:var(--err)]/35 bg-[color:var(--err-bg)] text-[color:var(--err)]",
}

const urgencyStyles: Record<SuggestedAction["urgency"], string> = {
  do_now: "border-[color:var(--sev-critical)]/35 bg-[color:var(--sev-critical-bg)] text-[color:var(--sev-critical)]",
  this_week: "border-[color:var(--sev-high)]/35 bg-[color:var(--sev-high-bg)] text-[color:var(--sev-high)]",
  watch: "border-[color:var(--sev-low)]/35 bg-[color:var(--sev-low-bg)] text-[color:var(--sev-low)]",
}

const urgencyLabels: Record<SuggestedAction["urgency"], string> = {
  do_now: "Do now",
  this_week: "This week",
  watch: "Watch",
}

export function cleanPrimaryCopy(text: string) {
  return text.replace(/^simulation:\s*/i, "")
}

export function formatSourceLabel(source: string) {
  if (source.startsWith("shopify_simulation")) return "shopify_monitoring"
  if (source.startsWith("shopify_monitoring")) return "shopify_monitoring"
  return source
}

export function formatImpactLabel(value: number) {
  return value > 0 ? formatCompactCurrency(value) : "Impact pending"
}

export function getSeverityConfidence(severity: IssueSeverity) {
  return confidenceBySeverity[severity]
}

export function SeverityPill({
  severity,
  className,
}: {
  severity: IssueSeverity
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 font-mono text-[0.64rem] tracking-[0.08em] uppercase",
        severityPillStyles[severity],
        className
      )}
    >
      {severity}
    </span>
  )
}

export function MetaPill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border/70 px-2 py-1 font-mono text-[0.64rem] tracking-[0.06em] uppercase text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

export function ScanStatePill({
  status,
  className,
}: {
  status: ScanStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 font-mono text-[0.64rem] tracking-[0.08em] uppercase",
        scanStateStyles[status],
        className
      )}
    >
      {status}
    </span>
  )
}

export function UrgencyPill({
  urgency,
  className,
}: {
  urgency: SuggestedAction["urgency"]
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[0.64rem] tracking-[0.08em] uppercase",
        urgencyStyles[urgency],
        className
      )}
    >
      <Clock3 className="h-3 w-3" />
      {urgencyLabels[urgency]}
    </span>
  )
}

export function QueueEventRow({
  severity,
  title,
  meta,
  amount,
  amountMuted = false,
}: {
  severity: IssueSeverity
  title: string
  meta: string
  amount: string
  amountMuted?: boolean
}) {
  return (
    <article className="grid grid-cols-[4px_1fr_auto] items-start gap-3.5 rounded-md border border-border/70 bg-background/35 px-0 py-0">
      <div className={cn("h-full rounded-l-md", severityStripeStyles[severity])} />
      <div className="py-3 pl-0 pr-2">
        <p className="text-sm text-foreground">{title}</p>
        <p className="mt-1 font-mono text-[0.66rem] tracking-[0.05em] text-muted-foreground">{meta}</p>
      </div>
      <div className="py-3 pr-3">
        <p
          className={cn(
            "font-mono text-[0.82rem] tracking-[0.03em] tabular-nums",
            amountMuted ? "text-muted-foreground" : "text-signal"
          )}
        >
          {amount}
        </p>
      </div>
    </article>
  )
}
