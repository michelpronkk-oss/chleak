import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { ONBOARDING_STATE_COOKIE } from "@/server/services/onboarding-state-service"
import {
  markStripeIntegrationErrored,
  persistStripeIntegration,
} from "@/server/services/stripe-persistence-service"
import { triggerQueuedScanTask } from "@/server/services/scan-task-service"
import {
  STRIPE_OAUTH_STATE_COOKIE,
  exchangeStripeCodeForToken,
  fetchStripeAccountDetails,
  parseStripeOauthState,
} from "@/server/services/stripe-service"
import {
  LIVE_SOURCE_CONTEXT_COOKIE,
  parseLiveSourceContext,
  STRIPE_SOURCE_STATE_COOKIE,
  serializeStripeSourceState,
} from "@/server/services/source-connection-state-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  const errorDescription = url.searchParams.get("error_description")
  const cookieStore = await cookies()
  const storedState = parseStripeOauthState(
    cookieStore.get(STRIPE_OAUTH_STATE_COOKIE)?.value
  )
  const liveSourceContext = parseLiveSourceContext(
    cookieStore.get(LIVE_SOURCE_CONTEXT_COOKIE)?.value
  )

  const redirectError = (status: string) =>
    NextResponse.redirect(
      new URL(`/app/stores?provider=stripe&status=${status}`, url.origin)
    )

  const withErrorState = async (
    response: NextResponse,
    input: { accountId: string | null; message: string }
  ) => {
    response.cookies.set(
      STRIPE_SOURCE_STATE_COOKIE,
      serializeStripeSourceState({
        status: "errored",
        accountId: input.accountId,
        message: input.message,
      }),
      { path: "/", httpOnly: true, sameSite: "lax" }
    )
    response.cookies.set(ONBOARDING_STATE_COOKIE, "empty", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    response.cookies.delete(STRIPE_OAUTH_STATE_COOKIE)

    if (storedState?.organizationId) {
      try {
        await markStripeIntegrationErrored({
          organizationId: storedState.organizationId,
          accountId: input.accountId,
          reason: input.message,
        })
      } catch {
        // Persistence errors should not block user-facing callback flow.
      }
    }

    return response
  }

  if (error) {
    return withErrorState(redirectError("callback_declined"), {
      accountId: null,
      message: errorDescription ?? `Stripe connect returned error: ${error}`,
    })
  }

  if (!code || !state || !storedState) {
    return withErrorState(redirectError("callback_missing"), {
      accountId: null,
      message: "Missing callback parameters",
    })
  }

  if (storedState.nonce !== state) {
    return withErrorState(redirectError("state_mismatch"), {
      accountId: null,
      message: "State mismatch in Stripe callback",
    })
  }

  try {
    const token = await exchangeStripeCodeForToken({ code })
    const account = await fetchStripeAccountDetails({
      accessToken: token.accessToken,
    })

    const persistence = await persistStripeIntegration({
      organizationId: storedState.organizationId,
      stripeAccountId: token.stripeAccountId,
      primaryLiveSourceUrl: liveSourceContext?.url ?? null,
      primaryLiveSourceDomain: liveSourceContext?.domain ?? null,
      sourceName: account.displayName ?? `Stripe ${token.stripeAccountId}`,
      scope: token.scope,
      livemode: token.livemode,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    })

    if (persistence.scanId) {
      const triggerResult = await triggerQueuedScanTask({
        scanId: persistence.scanId,
        organizationId: storedState.organizationId,
        storeId: persistence.storeId,
        provider: "stripe",
      })
      if (!triggerResult.ok) {
        console.error(
          `[stripe] automatic scan trigger failed: organization=${storedState.organizationId}; scan_id=${persistence.scanId}; reason=${triggerResult.reason}`
        )
      }
    }

    const response = NextResponse.redirect(
      new URL("/app/stores?provider=stripe&status=connected", url.origin)
    )
    response.cookies.set(ONBOARDING_STATE_COOKIE, "pending_stripe", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    response.cookies.set(
      STRIPE_SOURCE_STATE_COOKIE,
      serializeStripeSourceState({
        status: "syncing",
        accountId: token.stripeAccountId,
        message: "Connected and waiting for first billing sync",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
    response.cookies.delete(STRIPE_OAUTH_STATE_COOKIE)
    return response
  } catch {
    return withErrorState(redirectError("callback_failed"), {
      accountId: null,
      message: "Stripe callback processing failed",
    })
  }
}
