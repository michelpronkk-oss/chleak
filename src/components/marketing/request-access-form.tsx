"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight } from "lucide-react"

interface RequestAccessFormProps {
  className?: string
  showTrustLine?: boolean
}

export function RequestAccessForm({
  className,
  showTrustLine = true,
}: RequestAccessFormProps) {
  const [email, setEmail] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    router.push(`/request-access?email=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-1.5 sm:rounded-xl sm:border sm:border-border/65 sm:bg-card/35 sm:p-1.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@company.com"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border/65 bg-card/35 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/38 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 sm:flex-1 sm:rounded-md sm:border-0 sm:bg-transparent sm:py-2.5 sm:pl-4 sm:pr-2 sm:text-sm"
          />
          <button
            type="submit"
            className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 sm:w-auto sm:shrink-0 sm:rounded-lg sm:py-2.5"
          >
            Request Access
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {showTrustLine && (
          <p className="mt-2.5 text-center font-mono text-[0.65rem] tracking-[0.09em] uppercase text-muted-foreground/38">
            Invite-only · Reviewed manually<span className="hidden sm:inline"> · Early operator access</span>
          </p>
        )}
      </form>
    </div>
  )
}
