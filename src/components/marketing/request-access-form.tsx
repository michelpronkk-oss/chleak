"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-1.5 sm:rounded-lg sm:border sm:border-border sm:bg-card sm:p-1.5">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@company.com"
            required
            autoComplete="email"
            className="h-auto w-full px-4 py-3 text-base sm:flex-1 sm:rounded-md sm:border-0 sm:bg-transparent sm:py-2.5 sm:pl-4 sm:pr-2 sm:text-sm"
          />
          <Button
            type="submit"
            className="h-auto w-full gap-2 rounded-md px-5 py-3 text-sm font-medium sm:w-auto sm:shrink-0 sm:py-2.5"
          >
            Request Access
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showTrustLine && (
          <p className="mt-2.5 text-center font-mono text-[0.62rem] tracking-[0.08em] uppercase text-muted-foreground/46">
            Invite-only / reviewed manually
            <span className="hidden sm:inline"> / early operator access</span>
          </p>
        )}
      </form>
    </div>
  )
}
