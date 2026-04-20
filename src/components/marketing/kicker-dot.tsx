"use client"

import { motion } from "motion/react"

export function KickerDot() {
  return (
    <motion.span
      className="h-1 w-1 rounded-full"
      style={{ background: "var(--signal)" }}
      animate={{
        opacity: [0.1, 1, 0.1],
        scale: [1, 1.5, 1],
        boxShadow: [
          "0 0 0px 0px rgba(200, 154, 16, 0)",
          "0 0 6px 2px rgba(200, 154, 16, 0.5)",
          "0 0 0px 0px rgba(200, 154, 16, 0)",
        ],
      }}
      transition={{
        duration: 2.6,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
    />
  )
}
