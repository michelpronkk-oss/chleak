import { NextResponse } from "next/server"
import type { EmailOtpType, User } from "@supabase/supabase-js"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { getPostAuthDestinationForPlanIntent } from "@/server/services/plan-state-service"

type BillingPlan = "starter" | "growth" | "pro"

const supportedOtpTypes: EmailOtpType[] = [
  "signup",
  "email",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
]

function parsePlan(raw: string | null): BillingPlan | null {
  if (raw === "starter" || raw === "growth" || raw === "pro") {
    return raw
  }

  return null
}

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) {
    return null
  }

  return supportedOtpTypes.includes(raw as EmailOtpType)
    ? (raw as EmailOtpType)
    : null
}

function resolveNextPath(raw: string | null, requestUrl: URL) {
  const direct = sanitizeNextPath(raw, "/app")
  if (direct !== "/app" || raw === "/app") {
    return direct
  }

  if (!raw) {
    return "/app"
  }

  try {
    const parsed = new URL(raw)
    const sameOrigin = parsed.origin === requestUrl.origin
    if (!sameOrigin) {
      return "/app"
    }

    return sanitizeNextPath(`${parsed.pathname}${parsed.search}`, "/app")
  } catch {
    return "/app"
  }
}

function toSignInRedirect(input: {
  origin: string
  next: string
  error: "callback_missing" | "callback_failed" | "workspace_setup_failed"
  plan: BillingPlan | null
}) {
  const redirectUrl = new URL("/auth/sign-in", input.origin)
  redirectUrl.searchParams.set("error", input.error)
  redirectUrl.searchParams.set("next", input.next)
  if (input.plan) {
    redirectUrl.searchParams.set("plan", input.plan)
  }
  return NextResponse.redirect(redirectUrl)
}

async function finalizeAuthenticatedRedirect(input: {
  user: User
  origin: string
  next: string
  selectedPlan: BillingPlan | null
}) {
  const metadata = input.user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null

  const membership = await ensureWorkspaceForUser({
    userId: input.user.id,
    email: input.user.email ?? null,
    fullName,
  })

  const destination = await getPostAuthDestinationForPlanIntent({
    organizationId: membership.organizationId,
    next: input.next,
    selectedPlan: input.selectedPlan,
  })

  return NextResponse.redirect(new URL(destination, input.origin))
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get("token_hash")
  const type = parseOtpType(requestUrl.searchParams.get("type"))
  const code = requestUrl.searchParams.get("code")
  const selectedPlan = parsePlan(requestUrl.searchParams.get("plan"))
  const next = resolveNextPath(requestUrl.searchParams.get("next"), requestUrl)
  const supabase = await createSupabaseServerClient()

  try {
    if (tokenHash && type) {
      const verifyResult = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      })

      if (verifyResult.error || !verifyResult.data.user) {
        return toSignInRedirect({
          origin: requestUrl.origin,
          next,
          error: "callback_failed",
          plan: selectedPlan,
        })
      }

      return await finalizeAuthenticatedRedirect({
        user: verifyResult.data.user,
        origin: requestUrl.origin,
        next,
        selectedPlan,
      })
    }

    if (code) {
      const exchangeResult = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeResult.error || !exchangeResult.data.user) {
        return toSignInRedirect({
          origin: requestUrl.origin,
          next,
          error: "callback_failed",
          plan: selectedPlan,
        })
      }

      return await finalizeAuthenticatedRedirect({
        user: exchangeResult.data.user,
        origin: requestUrl.origin,
        next,
        selectedPlan,
      })
    }

    return toSignInRedirect({
      origin: requestUrl.origin,
      next,
      error: "callback_missing",
      plan: selectedPlan,
    })
  } catch {
    return toSignInRedirect({
      origin: requestUrl.origin,
      next,
      error: "workspace_setup_failed",
      plan: selectedPlan,
    })
  }
}

