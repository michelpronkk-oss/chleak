"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

export function SignOutButton() {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (pending) return
    setPending(true)
    try {
      await fetch("/api/auth/sign-out?next=/", { method: "POST" })
    } finally {
      window.location.assign("/")
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Signing out..." : "Sign out"}
    </button>
  )
}
