import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import {
  ONBOARDING_STATE_COOKIE,
  isOnboardingState,
} from "@/server/services/onboarding-state-service"
import {
  SHOPIFY_SOURCE_STATE_COOKIE,
  STRIPE_SOURCE_STATE_COOKIE,
  serializeShopifySourceState,
  serializeStripeSourceState,
} from "@/server/services/source-connection-state-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const state = url.searchParams.get("state")
  const next = sanitizeNextPath(url.searchParams.get("next"), "/app")

  if (!state || !isOnboardingState(state)) {
    return NextResponse.json(
      { message: "Invalid onboarding state." },
      { status: 400 }
    )
  }

  const response = NextResponse.redirect(new URL(next, url.origin))
  response.cookies.set(ONBOARDING_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  if (state === "empty") {
    response.cookies.set(
      STRIPE_SOURCE_STATE_COOKIE,
      serializeStripeSourceState({
        status: "not_connected",
        accountId: null,
        message: null,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
    response.cookies.set(
      SHOPIFY_SOURCE_STATE_COOKIE,
      serializeShopifySourceState({
        status: "not_connected",
        shopDomain: null,
        message: null,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
  }

  if (state === "pending_stripe") {
    response.cookies.set(
      STRIPE_SOURCE_STATE_COOKIE,
      serializeStripeSourceState({
        status: "syncing",
        accountId: null,
        message: "Initial billing scan in progress",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
  }

  if (state === "pending_shopify") {
    response.cookies.set(
      SHOPIFY_SOURCE_STATE_COOKIE,
      serializeShopifySourceState({
        status: "syncing",
        shopDomain: null,
        message: "Initial scan in progress",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
  }

  if (state === "completed_shopify" || state === "demo") {
    response.cookies.set(
      SHOPIFY_SOURCE_STATE_COOKIE,
      serializeShopifySourceState({
        status: "connected",
        shopDomain: null,
        message: state === "demo" ? "Demo data mode" : "Connected and monitoring",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
  }

  if (state === "first_results_shopify") {
    response.cookies.set(
      SHOPIFY_SOURCE_STATE_COOKIE,
      serializeShopifySourceState({
        status: "connected",
        shopDomain: null,
        message: "First findings ready",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
  }

  if (state === "completed_stripe" || state === "demo") {
    response.cookies.set(
      STRIPE_SOURCE_STATE_COOKIE,
      serializeStripeSourceState({
        status: "connected",
        accountId: null,
        message: state === "demo" ? "Demo data mode" : "Connected and monitoring",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
  }

  if (state === "first_results_stripe") {
    response.cookies.set(
      STRIPE_SOURCE_STATE_COOKIE,
      serializeStripeSourceState({
        status: "connected",
        accountId: null,
        message: "First findings ready",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
  }

  return response
}
