"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface SignInFormProps {
  next: string
  plan?: string | null
  defaultEmail?: string
}

export function SignInForm({ next, plan, defaultEmail }: SignInFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || pending) return
    setPending(true)

    try {
      const body = new FormData()
      body.set("email", trimmed)
      body.set("next", next)
      if (plan) body.set("plan", plan)

      // fetch follows redirects by default — res.url is the final URL after
      // the API route's NextResponse.redirect. Navigate there explicitly so
      // the router reflects the correct state (check_email, error, etc.).
      const res = await fetch("/api/auth/magic-link", { method: "POST", body })
      const dest = new URL(res.url)
      router.push(dest.pathname + dest.search)
    } catch {
      router.push(
        `/auth/sign-in?next=${encodeURIComponent(next)}&email=${encodeURIComponent(email.trim())}&error=send_failed`
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-xs text-muted-foreground">
          Approved work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="vault-input w-full rounded-lg px-3.5 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-border sm:text-sm"
          placeholder="you@brand.com"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="marketing-primary-cta mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? "Sending..." : "Email me a sign-in link"}
      </button>
    </form>
  )
}
