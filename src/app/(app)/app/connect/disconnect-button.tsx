"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

export function DisconnectButton({ label, action, next }: { label: string; action: string; next: string }) {
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function handleClick() {
    if (pending) return
    setPending(true)
    try {
      const res = await fetch(action, { method: "POST" })
      const dest = new URL(res.url)
      router.push(dest.pathname + dest.search)
    } catch {
      router.push(next)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
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
