import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import {
  getPlanEntitlement,
  getPlanStateForOrganization,
} from "@/server/services/plan-state-service"

type AuthEntryMode = "sign-in" | "sign-up"
type BillingPlan = "starter" | "growth" | "pro"

function parseAuthEntryMode(raw: string | null): AuthEntryMode {
  return raw === "sign-in" ? "sign-in" : "sign-up"
}

function parsePlan(raw: string | null): BillingPlan | null {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const next = sanitizeNextPath(url.searchParams.get("next"), "/app/billing")
  const plan = parsePlan(url.searchParams.get("plan"))
  const intent = url.searchParams.get("intent")
  const authMode = parseAuthEntryMode(url.searchParams.get("auth"))

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

  if (!user) {
    const authRedirect = new URL(`/auth/${authMode}`, url.origin)
    authRedirect.searchParams.set("next", `${nextUrl.pathname}${nextUrl.search}`)
    if (plan) {
      authRedirect.searchParams.set("plan", plan)
    }
    return NextResponse.redirect(authRedirect)
  }

  if (plan) {
    const metadata = user.user_metadata as Record<string, unknown> | null
    const fullName =
      typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
        ? metadata.full_name.trim()
        : null

    try {
      const workspace = await ensureWorkspaceForUser({
        userId: user.id,
        email: user.email ?? null,
        fullName,
      })
      const planState = await getPlanStateForOrganization(workspace.organizationId)
      const entitlement = getPlanEntitlement(planState)

      if (entitlement.hasActiveAccess) {
        return NextResponse.redirect(new URL("/app", url.origin))
      }
    } catch {
      const fallback = new URL("/app/billing", url.origin)
      fallback.searchParams.set("intent", "workspace_setup_failed")
      if (plan) {
        fallback.searchParams.set("plan", plan)
      }
      return NextResponse.redirect(fallback)
    }
  }

  return NextResponse.redirect(nextUrl)
}
