import { NextResponse } from "next/server"

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
  const organizationId =
    url.searchParams.get("orgId") ??
    process.env.CHECKOUTLEAK_DEFAULT_ORGANIZATION_ID ??
    "org_luma-health"

  const setup = getStripeSetupState()
  if (!setup.configured) {
    return NextResponse.redirect(
      new URL("/app/connect?provider=stripe&status=setup_required", url.origin)
    )
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
      new URL("/app/connect?provider=stripe&status=callback_failed", url.origin)
    )
  }
}
