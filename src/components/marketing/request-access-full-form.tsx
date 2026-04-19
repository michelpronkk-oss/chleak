"use client"

import { useState } from "react"

type Platform = "shopify" | "stripe" | "both"

const platformOptions: { value: Platform; label: string }[] = [
  { value: "shopify", label: "Shopify" },
  { value: "stripe", label: "Stripe" },
  { value: "both", label: "Both" },
]

const revenueBandOptions = [
  { value: "", label: "Prefer not to say" },
  { value: "under_1m", label: "Under $1M / year" },
  { value: "1m_5m", label: "$1M - $5M / year" },
  { value: "5m_20m", label: "$5M - $20M / year" },
  { value: "20m_plus", label: "$20M+ / year" },
]

const inputClass =
  "w-full rounded-lg border bg-background/40 px-3.5 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/38 focus:border-primary/50"

const labelClass =
  "block font-mono text-[0.63rem] tracking-[0.1em] uppercase text-muted-foreground/50 mb-1.5"

function fieldInputClass(hasError: boolean) {
  return inputClass + (hasError ? " border-red-400/60" : " border-border/60")
}

interface FieldErrors {
  fullName?: string
  email?: string
  platform?: string
}

interface Props {
  defaultEmail?: string
}

export function RequestAccessFullForm({ defaultEmail = "" }: Props) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState(defaultEmail)
  const [storeUrl, setStoreUrl] = useState("")
  const [platform, setPlatform] = useState<Platform | "">("")
  const [revenueBand, setRevenueBand] = useState("")
  const [painPrompt, setPainPrompt] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [submitError, setSubmitError] = useState("")

  function validate(): FieldErrors {
    const errors: FieldErrors = {}
    if (!fullName.trim()) errors.fullName = "Your name is required."
    if (!email.trim()) {
      errors.email = "Work email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address."
    }
    if (!platform) errors.platform = "Select a platform to continue."
    return errors
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setState("submitting")
    setSubmitError("")

    try {
      const res = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          store_url: storeUrl.trim() || undefined,
          platform,
          revenue_band: revenueBand || undefined,
          pain_prompt: painPrompt.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setState("success")
      } else {
        setState("error")
        setSubmitError("Something went wrong. Please try again.")
      }
    } catch {
      setState("error")
      setSubmitError("Could not submit. Check your connection and try again.")
    }
  }

  if (state === "success") {
    return (
      <div className="py-4 text-center sm:py-6">
        <div className="mx-auto mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/7">
          <svg
            className="h-3.5 w-3.5 text-primary/70"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-[1rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.1rem]">
          Request received.
        </h3>

        <p className="mx-auto mt-2.5 max-w-[32ch] text-[0.84rem] leading-[1.72] text-muted-foreground sm:mt-3 sm:max-w-[36ch] sm:text-[0.9rem] sm:leading-[1.78]">
          We review every submission and reach out directly if there is a fit.
        </p>

        <div className="mx-auto mt-5 h-px max-w-[120px] bg-border/35" />

        <p className="mt-4 font-mono text-[0.6rem] tracking-[0.1em] uppercase text-muted-foreground/35">
          Reviewed manually · No automated response
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="ra-full-name" className={labelClass}>
            Full name
          </label>
          <input
            id="ra-full-name"
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }))
            }}
            autoComplete="name"
            placeholder="Your name"
            className={fieldInputClass(!!fieldErrors.fullName)}
          />
          {fieldErrors.fullName && (
            <p className="mt-1 font-mono text-[0.6rem] tracking-[0.04em] text-red-400/75">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="ra-email" className={labelClass}>
            Work email
          </label>
          <input
            id="ra-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
            }}
            autoComplete="email"
            placeholder="you@brand.com"
            className={fieldInputClass(!!fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p className="mt-1 font-mono text-[0.6rem] tracking-[0.04em] text-red-400/75">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="ra-store-url" className={labelClass}>
          Company or store URL{" "}
          <span className="normal-case tracking-normal text-muted-foreground/30">(optional)</span>
        </label>
        <input
          id="ra-store-url"
          type="text"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          autoComplete="url"
          placeholder="yourstore.com"
          className={fieldInputClass(false)}
        />
      </div>

      <div>
        <p className={labelClass}>
          Platform
        </p>
        <div className="flex gap-2">
          {platformOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPlatform(opt.value)
                if (fieldErrors.platform) setFieldErrors((p) => ({ ...p, platform: undefined }))
              }}
              className={[
                "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                platform === opt.value
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/55 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {fieldErrors.platform && (
          <p className="mt-1.5 font-mono text-[0.6rem] tracking-[0.04em] text-red-400/75">
            {fieldErrors.platform}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="ra-revenue" className={labelClass}>
          Annual revenue{" "}
          <span className="normal-case tracking-normal text-muted-foreground/30">(optional)</span>
        </label>
        <select
          id="ra-revenue"
          value={revenueBand}
          onChange={(e) => setRevenueBand(e.target.value)}
          className={fieldInputClass(false) + " cursor-pointer"}
        >
          {revenueBandOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ra-pain" className={labelClass}>
          What are you trying to solve?{" "}
          <span className="normal-case tracking-normal text-muted-foreground/30">(optional)</span>
        </label>
        <textarea
          id="ra-pain"
          value={painPrompt}
          onChange={(e) => setPainPrompt(e.target.value)}
          rows={3}
          placeholder="Where you think revenue is leaking, what you have already tried, or why now."
          className={fieldInputClass(false) + " resize-none leading-[1.65]"}
        />
      </div>

      {state === "error" && submitError && (
        <p className="font-mono text-[0.62rem] tracking-[0.04em] text-red-400/75">{submitError}</p>
      )}

      <div className="pt-0.5">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="marketing-primary-cta inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-px hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "submitting" ? "Sending..." : "Send request"}
        </button>

        <p className="mt-3 text-center font-mono text-[0.6rem] tracking-[0.09em] uppercase text-muted-foreground/32">
          Invite-only · Reviewed manually · Early operator access
        </p>
      </div>
    </form>
  )
}
