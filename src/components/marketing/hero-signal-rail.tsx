"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

const statusItems = [
  { id: "activation", text: "Scanning activation and checkout surfaces" },
  { id: "payments", text: "Validating payment coverage" },
  { id: "recovery", text: "Ranking recovery paths" },
]

function ActiveDot() {
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

function CyclingStatus({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="relative h-[1.1rem] min-w-0 flex-1 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={activeIndex}
          className="absolute inset-0 flex items-center font-mono text-[0.64rem] tracking-[0.03em] text-muted-foreground/50"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {statusItems[activeIndex].text}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export function HeroSignalRail() {
  const [activeIndex, setActiveIndex] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % statusItems.length)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      className="mx-auto mt-5 w-full max-w-sm text-left sm:mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.26 }}
    >
      {/* Hairline anchor */}
      <div className="mb-3 h-px" style={{ background: "var(--line-subtle)" }} />

      {/* Mobile: dot + cycling text + trailing label — no "live" or divider */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <ActiveDot />
        <CyclingStatus activeIndex={activeIndex} />
        <span className="shrink-0 font-mono text-[0.53rem] tracking-[0.08em] uppercase text-muted-foreground/26">
          monitoring
        </span>
      </div>

      {/* Desktop: full composition with "live" label and divider */}
      <div className="hidden sm:flex sm:items-center sm:gap-2.5">
        <ActiveDot />
        <span className="font-mono text-[0.53rem] tracking-[0.1em] uppercase text-muted-foreground/32">
          live
        </span>
        <div className="h-3 w-px shrink-0" style={{ background: "var(--line-default)" }} />
        <CyclingStatus activeIndex={activeIndex} />
        <span className="shrink-0 font-mono text-[0.53rem] tracking-[0.08em] uppercase text-muted-foreground/26">
          monitoring
        </span>
      </div>
    </motion.div>
  )
}
