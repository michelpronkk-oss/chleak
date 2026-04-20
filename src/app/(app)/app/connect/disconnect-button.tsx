"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

export function DisconnectButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false)

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => setPending(true)}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-auto",
        pending && "cursor-not-allowed opacity-60"
      )}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Disconnecting..." : label}
    </button>
  )
}
