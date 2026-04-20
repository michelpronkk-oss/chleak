"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { cn } from "@/lib/utils"

interface SubmitButtonProps {
  label: string
  pendingLabel?: string
  className?: string
}

export function SubmitButton({ label, pendingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const [showSaved, setShowSaved] = useState(false)
  const prevPendingRef = useRef(false)

  useEffect(() => {
    if (prevPendingRef.current && !pending) {
      setShowSaved(true)
      prevPendingRef.current = false
      const timer = setTimeout(() => setShowSaved(false), 1800)
      return () => clearTimeout(timer)
    }
    prevPendingRef.current = pending
  }, [pending])

  return (
    <button
      type="submit"
      disabled={pending || showSaved}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/40 px-4 py-2 text-sm transition-colors hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-60",
        showSaved ? "text-[color:var(--ok)]" : "text-foreground",
        className
      )}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {showSaved && <Check className="h-3.5 w-3.5" />}
      {pending ? (pendingLabel ?? "Saving...") : showSaved ? "Saved" : label}
    </button>
  )
}
