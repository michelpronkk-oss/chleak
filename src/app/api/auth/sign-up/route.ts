import { NextResponse } from "next/server"

import { getAppOriginFromEnv, sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { getPostAuthDestinationForPlanIntent } from "@/server/services/plan-state-service"

type BillingPlan = "starter" | "growth" | "pro"

function parsePlan(raw: FormDataEntryValue | null): BillingPlan | null {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

function toErrorRedirect(
  origin: string,
  next: string,
  reason: string,
  email?: string,
  plan?: BillingPlan | null
) {
  const url = new URL("/auth/sign-up", origin)
  url.searchParams.set("error", reason)
  url.searchParams.set("next", next)
  if (plan) {
    url.searchParams.set("plan", plan)
  }
  if (email) {
    url.searchParams.set("email", email)
  }
  return NextResponse.redirect(url)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const emailRaw = formData.get("email")
  const passwordRaw = formData.get("password")
  const fullNameRaw = formData.get("fullName")
  const nextRaw = formData.get("next")
  const planRaw = formData.get("plan")

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : ""
  const password = typeof passwordRaw === "string" ? passwordRaw : ""
  const fullName = typeof fullNameRaw === "string" && fullNameRaw.trim().length > 0
    ? fullNameRaw.trim()
    : null
  const next = sanitizeNextPath(typeof nextRaw === "string" ? nextRaw : null, "/app")
  const selectedPlan = parsePlan(planRaw)
  const postAuthDestinationFromPlan = selectedPlan
    ? `/app/billing?intent=choose-plan&plan=${selectedPlan}`
    : next
  const url = new URL(request.url)

  if (!email || !password) {
    return toErrorRedirect(url.origin, next, "missing_fields", email, selectedPlan)
  }

  const authOrigin = getAppOriginFromEnv() ?? url.origin
  const callbackPath = new URL("/auth/confirm", authOrigin)
  callbackPath.searchParams.set("next", postAuthDestinationFromPlan)
  if (selectedPlan) {
    callbackPath.searchParams.set("plan", selectedPlan)
  }

  const supabase = await createSupabaseServerClient()
  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: callbackPath.toString(),
    },
  })

  if (signUpResult.error || !signUpResult.data.user) {
    return toErrorRedirect(url.origin, next, "sign_up_failed", email, selectedPlan)
  }

  if (!signUpResult.data.session) {
    const redirectUrl = new URL("/auth/sign-in", url.origin)
    redirectUrl.searchParams.set("state", "check_email")
    redirectUrl.searchParams.set("next", postAuthDestinationFromPlan)
    if (selectedPlan) {
      redirectUrl.searchParams.set("plan", selectedPlan)
    }
    redirectUrl.searchParams.set("email", email)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const membership = await ensureWorkspaceForUser({
      userId: signUpResult.data.user.id,
      email: signUpResult.data.user.email ?? email,
      fullName,
    })

    const postAuthDestination = await getPostAuthDestinationForPlanIntent({
      organizationId: membership.organizationId,
      next,
      selectedPlan,
    })

    return NextResponse.redirect(new URL(postAuthDestination, url.origin))
  } catch {
    return toErrorRedirect(
      url.origin,
      next,
      "workspace_setup_failed",
      email,
      selectedPlan
    )
  }
}
