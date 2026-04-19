"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import type { FixPlanStatus } from "@/types/domain"

const statusLabel: Record<FixPlanStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
}

export function FixPlanControls({
  initialStatus,
}: {
  initialStatus: FixPlanStatus
}) {
  const [status, setStatus] = useState<FixPlanStatus>(initialStatus)

  const statusTone = useMemo(() => {
    if (status === "resolved") {
      return "text-emerald-300"
    }

    if (status === "in_progress") {
      return "text-amber-300"
    }

    return "text-sky-300"
  }, [status])

  return (
    <section className="surface-card p-4 sm:p-5 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="data-mono text-muted-foreground">Action Controls</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Update execution status as the team completes this fix.
          </p>
        </div>
        <p className={`text-sm font-medium ${statusTone}`}>Status: {statusLabel[status]}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setStatus("in_progress")}
          className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-2.5 text-sm text-amber-300 transition-opacity hover:opacity-90"
        >
          Mark as in progress
        </button>
        <button
          type="button"
          onClick={() => setStatus("resolved")}
          className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-sm text-emerald-300 transition-opacity hover:opacity-90"
        >
          Mark as resolved
        </button>
        <Link
          href="/app"
          className="rounded-lg border border-border/70 px-4 py-2.5 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  )
}

