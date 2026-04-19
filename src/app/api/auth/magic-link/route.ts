import { NextResponse } from "next/server"

import { getAccessApprovalState } from "@/lib/auth/access"
import { getAppOriginFromEnv, sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type BillingPlan = "starter" | "growth" | "pro"

const SEND_COOLDOWN_SECONDS = 45
const MAGIC_LINK_COOLDOWN_COOKIE = "checkoutleak_magic_link_cooldown"

function parsePlan(raw: FormDataEntryValue | null): BillingPlan | null {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

function toSignInRedirect(input: {
  origin: string
  next: string
  plan: BillingPlan | null
  email: string
  state?: string
  error?: string
}) {
  const url = new URL("/auth/sign-in", input.origin)
  url.searchParams.set("next", input.next)
  url.searchParams.set("email", input.email)

  if (input.plan) {
    url.searchParams.set("plan", input.plan)
  }
  if (input.state) {
    url.searchParams.set("state", input.state)
  }
  if (input.error) {
    url.searchParams.set("error", input.error)
  }

  return url
}

async function ensureApprovedUserExists(email: string) {
  const admin = createSupabaseAdminClient()
  const createResult = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (
    createResult.error &&
    !createResult.error.message.toLowerCase().includes("already") &&
    !createResult.error.message.toLowerCase().includes("exists")
  ) {
    throw createResult.error
  }
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const emailRaw = formData.get("email")
  const nextRaw = formData.get("next")
  const planRaw = formData.get("plan")

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : ""
  const next = sanitizeNextPath(typeof nextRaw === "string" ? nextRaw : null, "/app")
  const plan = parsePlan(planRaw)
  const url = new URL(request.url)

  if (!email) {
    return NextResponse.redirect(
      toSignInRedirect({
        origin: url.origin,
        next,
        plan,
        email,
        error: "missing_email",
      })
    )
  }

  const approvalState = await getAccessApprovalState(email)
  if (approvalState !== "approved") {
    const error = approvalState === "pending" ? "under_review" : "not_approved"
    return NextResponse.redirect(
      toSignInRedirect({
        origin: url.origin,
        next,
        plan,
        email,
        error,
      })
    )
  }

  const cookieHeader = request.headers.get("cookie") ?? ""
  if (cookieHeader.includes(`${MAGIC_LINK_COOLDOWN_COOKIE}=1`)) {
    return NextResponse.redirect(
      toSignInRedirect({
        origin: url.origin,
        next,
        plan,
        email,
        error: "rate_limited",
      })
    )
  }

  try {
    await ensureApprovedUserExists(email)

    const authOrigin = getAppOriginFromEnv() ?? url.origin
    const redirectToUrl = new URL("/auth/confirm", authOrigin)
    redirectToUrl.searchParams.set("next", next)
    if (plan) {
      redirectToUrl.searchParams.set("plan", plan)
    }

    const supabase = await createSupabaseServerClient()
    const otpResult = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectToUrl.toString(),
      },
    })

    if (otpResult.error) {
      return NextResponse.redirect(
        toSignInRedirect({
          origin: url.origin,
          next,
          plan,
          email,
          error: "send_failed",
        })
      )
    }

    const response = NextResponse.redirect(
      toSignInRedirect({
        origin: url.origin,
        next,
        plan,
        email,
        state: "check_email",
      })
    )
    response.cookies.set(MAGIC_LINK_COOLDOWN_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SEND_COOLDOWN_SECONDS,
    })

    return response
  } catch {
    return NextResponse.redirect(
      toSignInRedirect({
        origin: url.origin,
        next,
        plan,
        email,
        error: "send_failed",
      })
    )
  }
}

