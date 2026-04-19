"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

const supportStates = [
  { label: "Checkout friction", status: "High priority" },
  { label: "Payment method gaps", status: "Coverage gap" },
  { label: "Billing recovery", status: "Recovery gap" },
]

export function MobileHeroSupportStrip() {
  const [activeIndex, setActiveIndex] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const visibleStates = [0, 1, 2].map((offset) => {
    return supportStates[(activeIndex + offset) % supportStates.length]
  })

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % supportStates.length)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="h-[5.6rem] overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeIndex}
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0.85, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0.8, y: -10 }}
            transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
            className="space-y-2"
          >
            {visibleStates.map((state, index) => (
              <div
                key={`${state.label}-${index}`}
                className={[
                  "flex items-center justify-between rounded-md border px-3 py-1.5",
                  index === 0
                    ? "border-border/35 bg-card/18 opacity-70"
                    : index === 1
                      ? "border-border/45 bg-card/24 opacity-85"
                      : "border-primary/25 bg-card/32",
                ].join(" ")}
              >
                <span className="font-mono text-[0.58rem] tracking-[0.08em] uppercase text-foreground/90">
                  {state.label}
                </span>
                <span className="font-mono text-[0.56rem] tracking-[0.06em] uppercase text-primary/75">
                  {state.status}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
