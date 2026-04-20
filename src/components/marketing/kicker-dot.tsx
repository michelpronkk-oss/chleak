"use client"

import { motion } from "motion/react"

export function KickerDot() {
  return (
    <motion.span
      className="h-1 w-1 rounded-full"
      style={{ background: "var(--signal)" }}
      animate={{ opacity: [0.1, 1, 0.1], scale: [1, 1.5, 1] }}
      transition={{
        duration: 2.6,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
    />
  )
}
