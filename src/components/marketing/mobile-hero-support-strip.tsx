"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

const supportStates = ["Checkout friction", "Payment method gaps", "Billing recovery"]

export function MobileHeroSupportStrip() {
  const [activeIndex, setActiveIndex] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % supportStates.length)
    }, 3200)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg border border-border/55 bg-card/28 px-3.5 py-2.5">
      <p className="font-mono text-[0.55rem] tracking-[0.08em] uppercase text-muted-foreground/48">
        Signal focus
      </p>
      <div className="mt-1.5 h-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={supportStates[activeIndex]}
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -5 }}
            transition={{ duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }}
            className="font-mono text-[0.7rem] tracking-[0.05em] uppercase text-primary/80"
          >
            {supportStates[activeIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="mt-1 text-[0.69rem] text-muted-foreground/62">Ranked by impact</p>
    </div>
  )
}

