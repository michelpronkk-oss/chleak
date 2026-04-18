"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function PendingScanLiveRefresh() {
  const router = useRouter()
  const [ticks, setTicks] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTicks((prev) => prev + 1)
      router.refresh()
    }, 2500)

    const stop = window.setTimeout(() => {
      window.clearInterval(interval)
    }, 45000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(stop)
    }
  }, [router])

  return (
    <p className="mt-4 text-xs text-muted-foreground">
      {ticks > 0
        ? "Checking for first results..."
        : "Scan in progress. Results appear automatically once ready."}
    </p>
  )
}

