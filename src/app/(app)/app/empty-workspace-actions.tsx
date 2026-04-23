"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

export function EmptyWorkspaceActions() {
  const [isOpeningDemo, setIsOpeningDemo] = useState(false)

  function handleOpenDemoWorkspace() {
    if (isOpeningDemo) return

    setIsOpeningDemo(true)
    // Use full document navigation so cookie mutations from the route handler
    // are applied before returning to /app in demo mode.
    window.location.assign("/api/mock/onboarding?state=demo&next=/app")
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/app/stores"
        className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
      >
        Set live source
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        onClick={handleOpenDemoWorkspace}
        disabled={isOpeningDemo}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isOpeningDemo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {isOpeningDemo ? "Opening demo..." : "Open demo workspace"}
      </button>
    </div>
  )
}
