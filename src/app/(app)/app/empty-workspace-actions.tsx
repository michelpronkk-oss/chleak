"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function EmptyWorkspaceActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link
        href="/app/stores"
        className="marketing-primary-cta inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-px"
      >
        Set primary source
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <p className="text-sm text-muted-foreground">
        Add the website or app URL you want SilentLeak to monitor first.
      </p>
    </div>
  )
}
