"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export function SignInSubmitButton() {
  const [pending, setPending] = useState(false)
  const searchParams = useSearchParams()

  // When the magic-link route redirects back to this page (soft navigation via
  // App Router), searchParams change — that signals the round-trip completed.
  // Reset pending so the button returns to its normal state.
  useEffect(() => {
    setPending(false)
  }, [searchParams])

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => setPending(true)}
      className="marketing-primary-cta mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Sending..." : "Email me a sign-in link"}
    </button>
  )
}
