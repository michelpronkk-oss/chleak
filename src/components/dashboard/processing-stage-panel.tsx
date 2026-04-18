"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

interface ProcessingStagePanelProps {
  title: string
  stages: string[]
  className?: string
}

export function ProcessingStagePanel({
  title,
  stages,
  className,
}: ProcessingStagePanelProps) {
  const safeStages = useMemo(
    () => (stages.length ? stages : ["Processing"]),
    [stages]
  )
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (safeStages.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        if (current >= safeStages.length - 1) {
          return current
        }
        return current + 1
      })
    }, 1400)

    return () => window.clearInterval(interval)
  }, [safeStages.length])

  const progressPercent =
    safeStages.length <= 1
      ? 100
      : Math.round(((activeIndex + 1) / safeStages.length) * 100)

  return (
    <section className={cn("surface-card border border-primary/25 bg-primary/[0.05] p-4", className)}>
      <p className="data-mono text-primary">{title}</p>
      <div className="mt-3 h-1.5 rounded-full bg-background/70">
        <div
          className="h-1.5 rounded-full bg-primary/70 transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2.5">
        {safeStages.map((stage, index) => {
          const isDone = index < activeIndex
          const isCurrent = index === activeIndex
          return (
            <li
              key={stage}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors",
                isDone
                  ? "text-primary/85"
                  : isCurrent
                    ? "text-foreground"
                    : "text-muted-foreground/65"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  isDone
                    ? "bg-primary/80"
                    : isCurrent
                      ? "animate-pulse bg-primary"
                      : "bg-border/70"
                )}
              />
              {stage}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

