import { NextResponse } from "next/server"

import { DodoConfigurationError } from "@/lib/billing/dodo"
import { getAppOriginFromEnv, sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { createDodoCheckoutForPlan } from "@/server/services/dodo-billing-service"

const validPlans = ["starter", "growth", "pro"] as const
type ValidPlan = (typeof validPlans)[number]

function isValidPlan(value: string | null): value is ValidPlan {
  return Boolean(value && validPlans.includes(value as ValidPlan))
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const plan = url.searchParams.get("plan")
  const next = sanitizeNextPath(url.searchParams.get("next"), "/app")

  if (!isValidPlan(plan)) {
    return NextResponse.json({ message: "Invalid plan." }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInUrl = new URL("/auth/sign-in", url.origin)
    signInUrl.searchParams.set("next", `/app/billing?intent=choose-plan&plan=${plan}`)
    return NextResponse.redirect(signInUrl)
  }

  const metadata = user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null
  const appUrl = getAppOriginFromEnv() ?? url.origin

  let membership: Awaited<ReturnType<typeof ensureWorkspaceForUser>>
  try {
    membership = await ensureWorkspaceForUser({
      userId: user.id,
      email: user.email ?? null,
      fullName,
    })
  } catch {
    const fallback = new URL("/app/billing", url.origin)
    fallback.searchParams.set("intent", "workspace_setup_failed")
    return NextResponse.redirect(fallback)
  }

  try {
    const checkout = await createDodoCheckoutForPlan({
      plan,
      organizationId: membership.organizationId,
      customerEmail: user.email ?? undefined,
      successUrl: `${appUrl}/app/billing?intent=checkout_success&plan=${plan}&next=${encodeURIComponent(next)}`,
      cancelUrl: `${appUrl}/app/billing?intent=checkout_cancelled&plan=${plan}`,
    })

    return NextResponse.redirect(checkout.checkoutUrl)
  } catch (error) {
    const fallback = new URL("/app/billing", url.origin)
    fallback.searchParams.set(
      "intent",
      error instanceof DodoConfigurationError
        ? "billing_config_missing"
        : "checkout_creation_failed"
    )
    fallback.searchParams.set("plan", plan)
    return NextResponse.redirect(fallback)
  }
}
