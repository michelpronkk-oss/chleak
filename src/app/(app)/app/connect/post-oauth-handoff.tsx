"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Check, LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export function PostOauthHandoff({
  connected,
  scanRunning,
  resultsReady,
}: {
  connected: boolean
  scanRunning: boolean
  resultsReady: boolean
}) {
  const router = useRouter()
  const [isForwarding, setIsForwarding] = useState(false)
  const [visualStep, setVisualStep] = useState(0)

  const stages = useMemo(
    () =>
      resultsReady
        ? [
            "Shopify connected",
            "First scan completed",
            "Revealing results...",
          ]
        : [
            "Shopify connected",
            scanRunning ? "First scan running..." : "Starting first scan...",
            "Preparing results view...",
          ],
    [resultsReady, scanRunning]
  )

  useEffect(() => {
    if (!connected) {
      return
    }

    const stepIntervalMs = 850
    const interval = window.setInterval(() => {
      setVisualStep((current) => {
        if (current >= stages.length) {
          return current
        }
        return current + 1
      })
    }, stepIntervalMs)

    return () => window.clearInterval(interval)
  }, [connected, stages.length])

  useEffect(() => {
    if (!connected || visualStep < stages.length || isForwarding) {
      return
    }

    const timeout = window.setTimeout(() => {
      setIsForwarding(true)
      router.push("/app")
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [connected, isForwarding, router, stages.length, visualStep])

  const progressPercent = Math.min(
    100,
    Math.round((visualStep / Math.max(stages.length, 1)) * 100)
  )

  return (
    <section className="surface-card border border-border/50 bg-background/30 p-4">
      <p className="data-mono text-muted-foreground">Connection Confirmed</p>
      <div className="mt-3 h-1.5 rounded-full bg-background/70">
        <div
          className="h-1.5 rounded-full bg-foreground/50 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ul className="mt-3 space-y-2.5">
        {stages.map((stage, index) => {
          const isDone = index < visualStep
          const isCurrent = index === visualStep && visualStep < stages.length
          return (
          <li
            key={stage}
            className={cn(
              "flex items-center gap-2.5 text-sm",
              isDone || isCurrent ? "text-foreground" : "text-muted-foreground/70"
            )}
          >
            {isDone ? (
              <Check className="h-3.5 w-3.5" />
            ) : isCurrent ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-border/70" />
            )}
            {stage}
          </li>
          )
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {isForwarding ? "Opening live scan status..." : "Opening live scan status in a moment..."}
        </p>
        <Link
          href="/app"
          className="vault-link inline-flex items-center gap-1 text-xs"
        >
          Open now <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  )
}
