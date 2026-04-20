"use client"

import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { TrendingDown, Minus, RotateCcw, AlertTriangle } from "lucide-react"

interface Signal {
  label: string
  finding: string
  impact: string
  severity: "high" | "medium"
}

const rowVariants = {
  hidden: { opacity: 0, y: 7 },
  visible: { opacity: 1, y: 0 },
}

function ImpactBadge({ label, severity }: { label: string; severity: "high" | "medium" }) {
  const Icon = severity === "high" ? TrendingDown : label.includes("Coverage") ? Minus : RotateCcw
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[0.63rem] tracking-[0.06em] uppercase",
        severity === "high"
          ? "border-signal/30 bg-signal/8 text-signal"
          : "border-border/40 text-muted-foreground/55",
      ].join(" ")}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" strokeWidth={2.2} />
      {label}
    </span>
  )
}

export function SignalConsole({ signals }: { signals: Signal[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <div
      ref={ref}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Console header */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="hero-live-indicator absolute inline-flex h-full w-full rounded-full bg-signal/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal/80" />
          </span>
          <p className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-muted-foreground/70">
            Private Leak Console
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="hidden font-mono text-[0.63rem] tracking-[0.06em] text-muted-foreground/35 sm:block">
            {signals.length} findings
          </p>
          <p className="font-mono text-[0.63rem] tracking-[0.06em] uppercase text-muted-foreground/35">
            Ranked by impact
          </p>
        </div>
      </div>

      {/* Column headers — desktop only */}
      <div className="hidden border-b border-border/30 px-6 py-2 sm:grid sm:grid-cols-[1.4fr_2.4fr_auto] sm:gap-6">
        <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted-foreground/28">Category</p>
        <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted-foreground/28">Finding</p>
        <p className="font-mono text-[0.58rem] tracking-[0.1em] uppercase text-muted-foreground/28">Signal</p>
      </div>

      {/* Rows */}
      <motion.div
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
      >
        {signals.map((signal, index) => (
          <motion.div
            key={signal.label}
            variants={rowVariants}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div
              className={[
                "group relative px-4 py-3.5 sm:grid sm:grid-cols-[1.4fr_2.4fr_auto] sm:items-center sm:gap-6 sm:px-6 sm:py-4",
                "transition-colors hover:bg-white/[0.018]",
                signal.severity === "high" ? "border-l-2 border-l-signal/50" : "border-l-2 border-l-transparent",
              ].join(" ")}
            >
              {/* Mobile: stacked layout */}
              <div className="flex items-start justify-between gap-3 sm:contents">
                <div className="min-w-0 sm:contents">
                  <p className="font-mono text-[0.6rem] tracking-[0.09em] uppercase text-muted-foreground/40 sm:text-[0.63rem]">
                    {signal.label}
                  </p>
                  <p className="mt-1 text-[0.84rem] leading-[1.52] text-foreground/88 sm:mt-0 sm:text-sm sm:leading-[1.55]">
                    {signal.finding}
                  </p>
                </div>
                <ImpactBadge label={signal.impact} severity={signal.severity} />
              </div>
            </div>
            {index < signals.length - 1 && (
              <div className="mx-4 h-px bg-border/18 sm:mx-6" />
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
