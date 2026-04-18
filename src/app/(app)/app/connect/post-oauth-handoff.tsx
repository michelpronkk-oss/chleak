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

  const stages = useMemo(
    () => [
      { label: "Shopify connected", done: connected, active: connected && !scanRunning },
      { label: "Starting first scan...", done: scanRunning || resultsReady, active: scanRunning && !resultsReady },
      { label: "Preparing results view...", done: resultsReady, active: resultsReady },
    ],
    [connected, scanRunning, resultsReady]
  )

  useEffect(() => {
    if (!connected) {
      return
    }

    const timeout = window.setTimeout(() => {
      setIsForwarding(true)
      router.push("/app")
    }, 1600)

    return () => window.clearTimeout(timeout)
  }, [connected, router])

  return (
    <section className="surface-card border border-primary/25 bg-primary/[0.05] p-4">
      <p className="data-mono text-primary">Connection Confirmed</p>
      <ul className="mt-3 space-y-2.5">
        {stages.map((stage) => (
          <li
            key={stage.label}
            className={cn(
              "flex items-center gap-2.5 text-sm",
              stage.done ? "text-primary/90" : "text-muted-foreground/70"
            )}
          >
            {stage.done ? (
              <Check className="h-3.5 w-3.5" />
            ) : stage.active ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-border/70" />
            )}
            {stage.label}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-xs text-muted-foreground">
          {isForwarding ? "Opening live scan status..." : "Opening live scan status in a moment..."}
        </p>
        <Link
          href="/app"
          className="inline-flex items-center gap-1 text-xs text-primary transition-opacity hover:opacity-80"
        >
          Open now <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  )
}

