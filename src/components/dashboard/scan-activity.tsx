import { Activity } from "lucide-react"

import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Scan } from "@/types/domain"

const statusStyles: Record<Scan["status"], string> = {
  queued: "text-sky-300",
  running: "text-primary",
  completed: "text-emerald-300",
  failed: "text-destructive",
}

export function ScanActivity({ scans }: { scans: Scan[] }) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Recent Scan Activity</h3>
        <Activity className="h-4 w-4 text-primary" />
      </div>
      <ul className="mt-4 space-y-3">
        {scans.map((scan) => (
          <li
            key={scan.id}
            className="rounded-xl border border-border/70 bg-card/70 px-3 py-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">Scan {scan.id.slice(-4)}</p>
              <span className={cn("text-xs uppercase", statusStyles[scan.status])}>
                {scan.status}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatRelativeTimestamp(scan.scannedAt)}</span>
              {scan.status === "completed" ? (
                <span>
                  {scan.detectedIssuesCount} issues ·{" "}
                  {formatCompactCurrency(scan.estimatedMonthlyLeakage)}
                </span>
              ) : (
                <span>Analyzing checkout and billing events</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
