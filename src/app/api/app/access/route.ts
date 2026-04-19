import { NextResponse } from "next/server"

import { getAccessApprovalState } from "@/lib/auth/access"
import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type BillingPlan = "starter" | "growth" | "pro"

function parsePlan(raw: string | null): BillingPlan | null {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const next = sanitizeNextPath(url.searchParams.get("next"), "/app")
  const plan = parsePlan(url.searchParams.get("plan"))
  const intent = url.searchParams.get("intent")
  const emailRaw = url.searchParams.get("email")
  const email = emailRaw ? emailRaw.trim().toLowerCase() : ""

  const nextUrl = new URL(next, url.origin)
  if (intent) {
    nextUrl.searchParams.set("intent", intent)
  }
  if (plan) {
    nextUrl.searchParams.set("plan", plan)
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const nextPathWithQuery = `${nextUrl.pathname}${nextUrl.search}`

  if (user?.email) {
    const approvalState = await getAccessApprovalState(user.email)

    if (approvalState === "approved") {
      return NextResponse.redirect(nextUrl)
    }

    if (approvalState === "pending" || approvalState === "rejected") {
      return NextResponse.redirect(new URL("/access-review", url.origin))
    }

    const requestAccessUrl = new URL("/request-access", url.origin)
    requestAccessUrl.searchParams.set("email", user.email)
    return NextResponse.redirect(requestAccessUrl)
  }

  if (email) {
    const approvalState = await getAccessApprovalState(email)

    if (approvalState === "approved") {
      const authRedirect = new URL("/auth/sign-in", url.origin)
      authRedirect.searchParams.set("next", nextPathWithQuery)
      authRedirect.searchParams.set("email", email)
      if (plan) {
        authRedirect.searchParams.set("plan", plan)
      }
      return NextResponse.redirect(authRedirect)
    }

    const requestAccessUrl = new URL("/request-access", url.origin)
    requestAccessUrl.searchParams.set("email", email)
    if (approvalState === "pending") {
      requestAccessUrl.searchParams.set("state", "under_review")
    }
    return NextResponse.redirect(requestAccessUrl)
  }

  const authRedirect = new URL("/auth/sign-in", url.origin)
  authRedirect.searchParams.set("next", nextPathWithQuery)
  if (plan) {
    authRedirect.searchParams.set("plan", plan)
  }
  if (intent === "app") {
    authRedirect.searchParams.set("mode", "open_app")
  }
  return NextResponse.redirect(authRedirect)
}
