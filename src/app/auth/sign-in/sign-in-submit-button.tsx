"use client"

import { Loader2 } from "lucide-react"
import { useState } from "react"

export function SignInSubmitButton() {
  const [pending, setPending] = useState(false)

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
