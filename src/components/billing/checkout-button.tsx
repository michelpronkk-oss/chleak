"use client"

import { useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { BillingPlan } from "@/types/domain"

interface CheckoutButtonProps {
  planId: BillingPlan
  organizationId?: string
  customerEmail?: string
  className?: string
}

export function CheckoutButton({
  planId,
  organizationId = "org_luma-health",
  customerEmail,
  className,
}: CheckoutButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleCheckout() {
    setIsPending(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/billing/dodo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          organizationId,
          customerEmail,
        }),
      })

      const payload = (await response.json()) as {
        checkoutUrl?: string
        message?: string
      }

      if (!response.ok || !payload.checkoutUrl) {
        setErrorMessage(
          payload.message ??
            "Billing is not configured yet. Add Dodo env vars to enable checkout."
        )
        return
      }

      window.location.assign(payload.checkoutUrl)
    } catch {
      setErrorMessage("Could not reach billing service. Try again in a moment.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {isPending ? "Creating checkout..." : "Start with Dodo"}
      </button>
      {errorMessage ? <p className="text-xs text-amber-300">{errorMessage}</p> : null}
    </div>
  )
}
