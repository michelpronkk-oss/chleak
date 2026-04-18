import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import {
  ONBOARDING_STATE_COOKIE,
} from "@/server/services/onboarding-state-service"
import {
  SHOPIFY_OAUTH_STATE_COOKIE,
  createShopifyInstallPayload,
  getShopifySetupState,
  normalizeShopDomain,
  serializeShopifyOauthState,
} from "@/server/services/shopify-service"
import {
  SHOPIFY_SOURCE_STATE_COOKIE,
  serializeShopifySourceState,
} from "@/server/services/source-connection-state-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const shop = url.searchParams.get("shop")

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInUrl = new URL("/auth/sign-in", url.origin)
    signInUrl.searchParams.set("next", "/app/connect?provider=shopify")
    return NextResponse.redirect(signInUrl)
  }

  const metadata = user.user_metadata as Record<string, unknown> | null
  const fullName =
    typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
      ? metadata.full_name.trim()
      : null

  let membership: Awaited<ReturnType<typeof ensureWorkspaceForUser>>
  try {
    membership = await ensureWorkspaceForUser({
      userId: user.id,
      email: user.email ?? null,
      fullName,
    })
  } catch {
    return NextResponse.redirect(
      new URL("/app/connect?provider=shopify&status=callback_failed", url.origin)
    )
  }
  const organizationId = membership.organizationId

  const setup = getShopifySetupState()
  if (!setup.configured) {
    return NextResponse.redirect(
      new URL("/app/connect?provider=shopify&status=setup_required", url.origin)
    )
  }

  if (!shop) {
    return NextResponse.redirect(
      new URL("/app/connect?provider=shopify&status=invalid_shop", url.origin)
    )
  }

  try {
    const shopDomain = normalizeShopDomain(shop)
    const payload = createShopifyInstallPayload({
      shopDomain,
      organizationId,
    })

    console.info(
      `[shopify] OAuth install: raw_input=${shop}; normalized_shop=${shopDomain}; authorize_url=${payload.installUrl}; nonce=${payload.stateNonce}; organization=${organizationId}`
    )

    const stateValue = serializeShopifyOauthState({
      nonce: payload.stateNonce,
      organizationId: payload.organizationId,
      shopDomain: payload.shopDomain,
    })

    const response = NextResponse.redirect(payload.installUrl)
    response.cookies.set(SHOPIFY_OAUTH_STATE_COOKIE, stateValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    })
    response.cookies.set(
      SHOPIFY_SOURCE_STATE_COOKIE,
      serializeShopifySourceState({
        status: "connecting",
        shopDomain,
        message: "OAuth install started",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
    response.cookies.set(ONBOARDING_STATE_COOKIE, "connecting_shopify", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch {
    const fallback = new URL("/app/connect?provider=shopify&status=invalid_shop", url.origin)
    fallback.searchParams.set("shop", shop)
    return NextResponse.redirect(
      fallback
    )
  }
}
