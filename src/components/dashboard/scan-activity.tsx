import { Activity } from "lucide-react"

import { ScanStatePill } from "@/components/dashboard/vault-primitives"
import { formatCompactCurrency, formatRelativeTimestamp } from "@/lib/format"
import type { Scan } from "@/types/domain"

export function ScanActivity({ scans }: { scans: Scan[] }) {
  return (
    <section className="surface-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Recent Scan Activity</h3>
        <Activity className="h-4 w-4 text-primary" />
      </div>
      <ul className="mt-4 space-y-2.5 sm:space-y-3">
        {scans.map((scan) => (
          <li
            key={scan.id}
            className="rounded-xl border border-border/70 bg-card/70 px-3 py-2.5 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">Scan {scan.id.slice(-4)}</p>
              <ScanStatePill status={scan.status} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatRelativeTimestamp(scan.scannedAt)}</span>
              {scan.status === "completed" ? (
                <span>
                  {scan.detectedIssuesCount} issues | {formatCompactCurrency(scan.estimatedMonthlyLeakage)}
                </span>
              ) : (
                <span>Scanning checkout and billing events</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
