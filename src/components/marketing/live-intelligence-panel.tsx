"use client"

import { motion } from "motion/react"

const issues = [
  { sev: "high", label: "Shipping step drop-off variance", impact: "$24.1k / mo" },
  { sev: "medium", label: "iOS wallet coverage gap", impact: "$18.7k / mo" },
  { sev: "medium", label: "Retry cadence underperforming", impact: "$16.1k / mo" },
]

const sevColor: Record<string, string> = {
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
}

function PulsingDot() {
  return (
    <motion.span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: "var(--signal)" }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{
        duration: 2.6,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
    />
  )
}

export function LiveIntelligencePanel() {
  return (
    <div
      className="vault-panel-shell"
      style={{
        borderColor: "color-mix(in oklab, var(--signal-line) 40%, var(--line-default) 60%)",
      }}
    >
      {/* Header */}
      <div className="vault-panel-head">
        <div className="flex items-center gap-2">
          <PulsingDot />
          <span className="vault-panel-title">Revenue intelligence</span>
        </div>
        <span className="font-mono text-[0.6rem] tracking-[0.08em] uppercase text-muted-foreground/40">
          live
        </span>
      </div>

      {/* Primary metric */}
      <div
        className="px-4 py-3.5 sm:px-5 sm:py-4"
        style={{
          borderBottom: "1px solid var(--line-subtle)",
          background:
            "linear-gradient(180deg, oklch(0.78 0.13 75 / 0.06), transparent 70%), var(--ink-100)",
        }}
      >
        <p className="vault-metric-key">Estimated monthly leakage</p>
        <p
          className="mt-1.5 font-mono text-2xl font-semibold tabular-nums sm:text-3xl"
          style={{ color: "var(--signal)" }}
        >
          $58.9k
        </p>
      </div>

      {/* Issue rows */}
      <div>
        {issues.map((issue, i) => (
          <div
            key={issue.label}
            className="flex items-center gap-3 px-4 py-2.5 sm:px-5"
            style={{
              borderBottom: i < issues.length - 1 ? "1px solid var(--line-subtle)" : undefined,
            }}
          >
            <div
              className="h-4 w-0.5 shrink-0 rounded-full"
              style={{ background: sevColor[issue.sev] }}
            />
            <p className="min-w-0 flex-1 text-xs text-foreground/80 sm:text-[0.8rem]">
              {issue.label}
            </p>
            <p className="shrink-0 font-mono text-[0.67rem] tabular-nums text-muted-foreground">
              {issue.impact}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 sm:px-5" style={{ borderTop: "1px solid var(--line-subtle)" }}>
        <p className="font-mono text-[0.59rem] tracking-[0.06em] uppercase text-muted-foreground/35">
          3 active findings &middot; ranked by impact
        </p>
      </div>
    </div>
  )
}
