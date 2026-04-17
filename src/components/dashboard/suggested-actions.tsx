import Link from "next/link"
import { ArrowRight, Clock3 } from "lucide-react"

import { formatCompactCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { SuggestedAction } from "@/types/domain"

const urgencyStyles: Record<SuggestedAction["urgency"], string> = {
  do_now: "text-destructive",
  this_week: "text-amber-300",
  watch: "text-sky-300",
}

const urgencyLabels: Record<SuggestedAction["urgency"], string> = {
  do_now: "Do now",
  this_week: "This week",
  watch: "Watch",
}

type SuggestedActionItem = SuggestedAction & { fixPlanHref: string }

export function SuggestedActions({ actions }: { actions: SuggestedActionItem[] }) {
  return (
    <section className="surface-card-strong p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="data-mono text-primary">Action Queue</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">Suggested Actions</h3>
        </div>
        <p className="rounded-md border border-primary/35 bg-primary/10 px-2 py-1 text-xs text-primary">
          Execute top to bottom
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {actions.map((action, index) => (
          <article
            key={action.id}
            className="rounded-xl border border-border/70 bg-background/40 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="data-mono text-muted-foreground">Step {String(index + 1).padStart(2, "0")}</p>
                <h4 className="text-sm font-semibold sm:text-base">{action.title}</h4>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border border-current/30 px-2 py-1 text-[11px] uppercase",
                  urgencyStyles[action.urgency]
                )}
              >
                <Clock3 className="h-3 w-3" />
                {urgencyLabels[action.urgency]}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
              <span className="text-primary">
                {formatCompactCurrency(action.estimatedMonthlyRevenueImpact)} / month
              </span>
              <span className="rounded-md border border-border/70 px-2 py-1 text-muted-foreground">
                Confidence: High
              </span>
              <Link
                href={action.fixPlanHref}
                className="inline-flex items-center gap-1 text-foreground transition-colors hover:text-primary"
              >
                Open fix plan <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
