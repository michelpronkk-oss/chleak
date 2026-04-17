import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface SummaryCardProps {
  label: string
  value: string
  detail: string
  tone?: "default" | "alert"
}

export function SummaryCard({
  label,
  value,
  detail,
  tone = "default",
}: SummaryCardProps) {
  return (
    <article
      className={cn(
        "surface-card p-5",
        tone === "alert" && "border-destructive/40 bg-destructive/5"
      )}
    >
      <p className="data-mono text-muted-foreground">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
        <ArrowUpRight
          className={cn(
            "h-5 w-5",
            tone === "alert" ? "text-destructive" : "text-primary"
          )}
        />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
    </article>
  )
}
