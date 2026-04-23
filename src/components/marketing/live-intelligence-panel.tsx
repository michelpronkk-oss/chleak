"use client"

import { motion } from "motion/react"

const issues = [
  { sev: "high", label: "Activation funnel dropout before first value", impact: "$24.1k / mo" },
  { sev: "high", label: "Shipping step drop-off variance", impact: "$18.7k / mo" },
  { sev: "medium", label: "Retry cadence underperforming", impact: "$16.1k / mo" },
  { sev: "medium", label: "Cross-border decline elevation", impact: "$9.2k / mo" },
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
      className="vault-panel-shell overflow-hidden"
      style={{
        borderColor: "color-mix(in oklab, var(--signal-line) 40%, var(--line-default) 60%)",
      }}
    >
      {/* Amber top accent */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, oklch(0.78 0.13 75 / 0.35), transparent)" }}
      />

      {/* Header */}
      <div className="vault-panel-head">
        <div className="flex items-center gap-2">
          <PulsingDot />
          <span className="vault-panel-title">Revenue leak signals</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[0.58rem] tracking-[0.06em] text-muted-foreground/30">SCN-2847</span>
          <span className="font-mono text-[0.6rem] tracking-[0.08em] uppercase text-muted-foreground/40">live</span>
        </div>
      </div>

      {/* Primary metric */}
      <div
        className="px-4 py-4 sm:px-5"
        style={{
          borderBottom: "1px solid var(--line-subtle)",
          background: "linear-gradient(180deg, oklch(0.78 0.13 75 / 0.06), transparent 70%), var(--ink-100)",
        }}
      >
        <p className="vault-metric-key">Estimated monthly leakage</p>
        <p
          className="mt-1.5 font-mono text-2xl font-semibold tabular-nums sm:text-3xl"
          style={{ color: "var(--signal)" }}
        >
          $68.1k
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <span className="font-mono text-[0.6rem] tracking-[0.06em] text-muted-foreground/45">4 findings</span>
          <span className="h-px w-3 bg-border/40" />
          <span className="font-mono text-[0.6rem] tracking-[0.06em] text-muted-foreground/45">ranked by exposure</span>
        </div>
      </div>

      {/* Issue rows */}
      <div>
        {issues.map((issue, i) => (
          <div
            key={issue.label}
            className="flex items-center gap-3 px-4 py-2.5 sm:px-5 transition-colors hover:bg-white/[0.015]"
            style={{
              borderBottom: i < issues.length - 1 ? "1px solid var(--line-subtle)" : undefined,
            }}
          >
            <div
              className="h-[18px] w-0.5 shrink-0 rounded-full"
              style={{ background: sevColor[issue.sev] }}
            />
            <p className="min-w-0 flex-1 text-[0.78rem] text-foreground/80 sm:text-[0.8rem]">
              {issue.label}
            </p>
            <p className="shrink-0 font-mono text-[0.66rem] tabular-nums text-signal/70">
              {issue.impact}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5"
        style={{ borderTop: "1px solid var(--line-subtle)" }}
      >
        <p className="font-mono text-[0.58rem] tracking-[0.06em] uppercase text-muted-foreground/32">
          Current live integrations: Shopify + Stripe &middot; ranked by impact
        </p>
        <p className="font-mono text-[0.58rem] tracking-[0.04em] text-muted-foreground/28">
          2m ago
        </p>
      </div>
    </div>
  )
}
