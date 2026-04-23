import { formatRelativeTimestamp } from "@/lib/format"
import type { FixPlan, FixPlanSignalStrength } from "@/types/domain"

const signalStrengthLabel: Record<FixPlanSignalStrength, string> = {
  strong: "Strong signal",
  moderate: "Moderate signal",
  early: "Early signal",
}

const signalStrengthTone: Record<FixPlanSignalStrength, string> = {
  strong: "text-amber-300",
  moderate: "text-sky-300",
  early: "text-emerald-300",
}

export function FixPlanEvidenceSection({ fixPlan }: { fixPlan: FixPlan }) {
  const evidence = fixPlan.evidence
  const detectionSummary = evidence?.detectionSummary ?? fixPlan.summary
  const whyTriggered = evidence?.whyTriggered ?? fixPlan.summary
  const recommendedNextAction =
    evidence?.recommendedNextAction ?? fixPlan.recommendedFix
  const successSignal = evidence?.successSignal ?? fixPlan.successSignal
  const rows = evidence?.rows ?? []

  return (
    <section className="surface-card p-4 sm:p-5 lg:p-6">
      <p className="data-mono text-muted-foreground">Detection evidence</p>

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-border/70 bg-background/35 p-4">
          <p className="data-mono text-muted-foreground">Detection summary</p>
          <p className="mt-2 text-sm text-foreground sm:text-base">{detectionSummary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Family: {evidence?.leakFamilyLabel ?? "Signal family pending"}</span>
            <span>Severity: {fixPlan.severity}</span>
            <span>
              Scan:{" "}
              {evidence?.scanTimestamp
                ? formatRelativeTimestamp(evidence.scanTimestamp)
                : formatRelativeTimestamp(fixPlan.detectedAt)}
            </span>
            {evidence?.signalStrength ? (
              <span className={signalStrengthTone[evidence.signalStrength]}>
                {signalStrengthLabel[evidence.signalStrength]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/35 p-4">
          <p className="data-mono text-muted-foreground">Why this triggered</p>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{whyTriggered}</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/35 p-4">
          <p className="data-mono text-muted-foreground">Detection evidence</p>
          {rows.length ? (
            <dl className="mt-3 divide-y divide-border/60">
              {rows.map((row) => (
                <div
                  key={`${row.label}:${row.value}`}
                  className="grid gap-1 py-2 sm:grid-cols-[220px_1fr] sm:items-center sm:gap-3"
                >
                  <dt className="text-xs text-muted-foreground">{row.label}</dt>
                  <dd className="font-mono text-xs text-foreground/90 sm:text-sm">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Structured evidence is still populating for this finding. Refresh after
              the next completed scan.
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <p className="data-mono text-muted-foreground">Recommended next action</p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {recommendedNextAction}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <p className="data-mono text-muted-foreground">Success signal</p>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {successSignal}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
