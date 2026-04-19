import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { MetaPill, UrgencyPill } from "@/components/dashboard/vault-primitives"
import { formatCompactCurrency } from "@/lib/format"
import type { SuggestedAction } from "@/types/domain"

type SuggestedActionItem = SuggestedAction & { fixPlanHref: string }

export function SuggestedActions({ actions }: { actions: SuggestedActionItem[] }) {
  return (
    <section className="surface-card-strong p-4 sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="data-mono text-primary">Action Queue</p>
          <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">Suggested Actions</h3>
        </div>
        <MetaPill className="text-primary">Execute top to bottom</MetaPill>
      </div>

      <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
        {actions.map((action, index) => (
          <article
            key={action.id}
            className="rounded-xl border border-border/70 bg-background/40 px-3.5 py-3.5 sm:px-4 sm:py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="data-mono text-muted-foreground">Step {String(index + 1).padStart(2, "0")}</p>
                <h4 className="text-sm font-semibold sm:text-[0.95rem]">{action.title}</h4>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
              <UrgencyPill urgency={action.urgency} />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs sm:mt-4 sm:pt-3">
              <span className="font-mono text-signal">
                {formatCompactCurrency(action.estimatedMonthlyRevenueImpact)} / month
              </span>
              <MetaPill>Confidence: High</MetaPill>
              <Link
                href={action.fixPlanHref}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1.5 text-foreground transition-colors hover:border-primary/35 hover:text-primary"
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
