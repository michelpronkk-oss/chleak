import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { ONBOARDING_STATE_COOKIE } from "@/server/services/onboarding-state-service"
import {
  STRIPE_OAUTH_STATE_COOKIE,
  createStripeConnectPayload,
  getStripeSetupState,
  serializeStripeOauthState,
} from "@/server/services/stripe-service"
import {
  STRIPE_SOURCE_STATE_COOKIE,
  serializeStripeSourceState,
} from "@/server/services/source-connection-state-service"

export async function GET(request: Request) {
  const url = new URL(request.url)

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInUrl = new URL("/auth/sign-in", url.origin)
    signInUrl.searchParams.set("next", "/app/stores?provider=stripe")
    return NextResponse.redirect(signInUrl)
  }

  const metadata = user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null

  const membership = await ensureWorkspaceForUser({
    userId: user.id,
    email: user.email ?? null,
    fullName,
  })
  const organizationId = membership.organizationId

  const setup = getStripeSetupState()
  if (!setup.configured) {
    const redirectUrl = new URL(
      "/app/stores?provider=stripe&status=setup_required",
      url.origin
    )
    if (setup.missing.length) {
      redirectUrl.searchParams.set("missing", setup.missing.join(","))
    }
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const payload = createStripeConnectPayload({ organizationId })
    const response = NextResponse.redirect(payload.connectUrl)

    response.cookies.set(
      STRIPE_OAUTH_STATE_COOKIE,
      serializeStripeOauthState({
        nonce: payload.stateNonce,
        organizationId: payload.organizationId,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 10,
      }
    )
    response.cookies.set(
      STRIPE_SOURCE_STATE_COOKIE,
      serializeStripeSourceState({
        status: "connecting",
        accountId: null,
        message: "OAuth connect started",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
    response.cookies.set(ONBOARDING_STATE_COOKIE, "connecting_stripe", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch {
    return NextResponse.redirect(
      new URL("/app/stores?provider=stripe&status=callback_failed", url.origin)
    )
  }
}
