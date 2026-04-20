"use client"

import { motion } from "motion/react"

import { cn } from "@/lib/utils"

interface InViewRevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function InViewReveal({ children, delay = 0, className }: InViewRevealProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-55px" }}
      transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
