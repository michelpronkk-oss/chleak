"use client"

import { ArrowRight, LoaderCircle } from "lucide-react"
import { useState } from "react"

export function StripeConnectSubmitButton() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <button
      type="submit"
      disabled={isSubmitting}
      onClick={() => setIsSubmitting(true)}
      className="marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {isSubmitting ? "Connecting Stripe..." : "Connect Stripe"}
      {isSubmitting ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
