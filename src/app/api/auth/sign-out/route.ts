import { NextResponse } from "next/server"

import { sanitizeNextPath } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ONBOARDING_STATE_COOKIE } from "@/server/services/onboarding-state-service"
import {
  SHOPIFY_SOURCE_STATE_COOKIE,
  STRIPE_SOURCE_STATE_COOKIE,
  serializeShopifySourceState,
  serializeStripeSourceState,
} from "@/server/services/source-connection-state-service"

async function signOut(request: Request) {
  const url = new URL(request.url)
  const next = sanitizeNextPath(url.searchParams.get("next"), "/")

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL(next, url.origin))
  response.cookies.set(ONBOARDING_STATE_COOKIE, "empty", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
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
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  return NextResponse.json(
    {
      message: "Use POST to sign out.",
      next: sanitizeNextPath(url.searchParams.get("next"), "/"),
    },
    { status: 405 }
  )
}

export async function POST(request: Request) {
  return signOut(request)
}
