"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface FadeInProps {
  className?: string
  children: React.ReactNode
  delay?: number
}

export function FadeIn({ className, children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
