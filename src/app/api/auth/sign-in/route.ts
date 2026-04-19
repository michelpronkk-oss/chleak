import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"

type BillingPlan = "starter" | "growth" | "pro"

function parsePlan(raw: FormDataEntryValue | null): BillingPlan | null {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const nextRaw = formData.get("next")
  const emailRaw = formData.get("email")
  const planRaw = formData.get("plan")

  const next = sanitizeNextPath(typeof nextRaw === "string" ? nextRaw : null, "/app")
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : ""
  const plan = parsePlan(planRaw)
  const url = new URL(request.url)

  const redirectUrl = new URL("/auth/sign-in", url.origin)
  redirectUrl.searchParams.set("next", next)
  if (email) {
    redirectUrl.searchParams.set("email", email)
  }
  if (plan) {
    redirectUrl.searchParams.set("plan", plan)
  }
  redirectUrl.searchParams.set("error", "password_disabled")

  return NextResponse.redirect(redirectUrl)
}

