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
    }, 4000)

    return () => {
      window.clearInterval(interval)
    }
  }, [router])

  const elapsedSeconds = ticks * 4

  return (
    <p className="mt-4 text-xs text-muted-foreground">
      {ticks === 0
        ? "Scan in progress. Results appear automatically once ready."
        : elapsedSeconds < 60
          ? "Checking for first results..."
          : "Still scanning. You can keep working in other tabs and return here for the updated state."}
    </p>
  )
}
