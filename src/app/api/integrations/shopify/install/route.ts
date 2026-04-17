import { NextResponse } from "next/server"

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
  const organizationId =
    url.searchParams.get("orgId") ?? process.env.CHECKOUTLEAK_DEFAULT_ORGANIZATION_ID ?? "org_luma-health"

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

    const response = NextResponse.redirect(payload.installUrl)
    response.cookies.set(
      SHOPIFY_OAUTH_STATE_COOKIE,
      serializeShopifyOauthState({
        nonce: payload.stateNonce,
        organizationId: payload.organizationId,
        shopDomain: payload.shopDomain,
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
    return NextResponse.redirect(
      new URL("/app/connect?provider=shopify&status=invalid_shop", url.origin)
    )
  }
}
