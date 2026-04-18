"use client"

import { ArrowRight, LoaderCircle } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

export function ShopifyConnectSubmitButton({
  disabled,
  label,
}: {
  disabled: boolean
  label: string
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={() => {
        if (disabled) {
          return
        }
        console.info("[shopify-ui] connect submit clicked")
        setIsSubmitting(true)
      }}
      className={cn(
        "marketing-primary-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-px sm:w-auto",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {isSubmitting ? "Connecting Shopify..." : label}
      {isSubmitting ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
