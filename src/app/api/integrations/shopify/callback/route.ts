import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  ONBOARDING_STATE_COOKIE,
} from "@/server/services/onboarding-state-service"
import {
  persistShopifyIntegration,
} from "@/server/services/shopify-persistence-service"
import {
  SHOPIFY_OAUTH_STATE_COOKIE,
  exchangeShopifyCodeForToken,
  fetchShopDetails,
  parseShopifyOauthState,
  registerShopifyWebhooks,
  verifyShopifyCallbackHmac,
} from "@/server/services/shopify-service"
import {
  SHOPIFY_SOURCE_STATE_COOKIE,
  serializeShopifySourceState,
} from "@/server/services/source-connection-state-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const shop = url.searchParams.get("shop")
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const hmac = url.searchParams.get("hmac")
  const cookieStore = await cookies()
  const storedState = parseShopifyOauthState(
    cookieStore.get(SHOPIFY_OAUTH_STATE_COOKIE)?.value
  )

  console.info(
    `[shopify] OAuth callback received: shop=${shop}; state_present=${!!state}; hmac_present=${!!hmac}; cookie_present=${!!storedState}; stored_shop=${storedState?.shopDomain ?? "none"}; stored_nonce_prefix=${storedState?.nonce?.slice(0, 8) ?? "none"}`
  )

  const redirectError = (status: string) =>
    NextResponse.redirect(
      new URL(`/app/connect?provider=shopify&status=${status}`, url.origin)
    )

  const withErrorState = (
    response: NextResponse,
    input: { shopDomain: string | null; message: string }
  ) => {
    response.cookies.set(
      SHOPIFY_SOURCE_STATE_COOKIE,
      serializeShopifySourceState({
        status: "errored",
        shopDomain: input.shopDomain,
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
    response.cookies.delete(SHOPIFY_OAUTH_STATE_COOKIE)
    return response
  }

  if (!shop || !code || !state || !hmac || !storedState) {
    return withErrorState(redirectError("callback_missing"), {
      shopDomain: shop ?? storedState?.shopDomain ?? null,
      message: "Missing callback parameters",
    })
  }

  const normalizedShop = shop.trim().toLowerCase()

  const isValidHmac = verifyShopifyCallbackHmac({
    queryParams: url.searchParams,
    receivedHmac: hmac,
  })

  if (!isValidHmac) {
    return withErrorState(redirectError("callback_invalid"), {
      shopDomain: storedState.shopDomain,
      message: "Callback verification failed",
    })
  }

  if (storedState.nonce !== state) {
    console.error(
      `[shopify] OAuth nonce mismatch: stored_nonce="${storedState.nonce}"; received_state="${state}"; stored_shop="${storedState.shopDomain}"; received_shop="${normalizedShop}"`
    )
    return withErrorState(redirectError("state_mismatch"), {
      shopDomain: storedState.shopDomain,
      message: "State mismatch in OAuth callback",
    })
  }

  console.info(
    `[shopify] OAuth state verified: stored_shop=${storedState.shopDomain}; callback_shop=${normalizedShop}; organization=${storedState.organizationId}`
  )

  try {
    const token = await exchangeShopifyCodeForToken({
      shopDomain: normalizedShop,
      code,
    })
    const shopMeta = await fetchShopDetails({
      shopDomain: normalizedShop,
      accessToken: token.accessToken,
    })
    await persistShopifyIntegration({
      organizationId: storedState.organizationId,
      shopDomain: shopMeta.myshopifyDomain,
      shopName: shopMeta.name,
      scopes: token.scopes,
      accessToken: token.accessToken,
    })

    const webhookResults = await registerShopifyWebhooks({
      shopDomain: normalizedShop,
      accessToken: token.accessToken,
    })

    const webhookFailure = webhookResults.some((result) => !result.success)
    if (webhookFailure) {
      return withErrorState(redirectError("webhook_registration_failed"), {
        shopDomain: shopMeta.myshopifyDomain,
        message: "Webhook registration failed",
      })
    }

    const response = NextResponse.redirect(
      new URL("/app/connect?provider=shopify&status=connected", url.origin)
    )
    response.cookies.set(ONBOARDING_STATE_COOKIE, "pending_shopify", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    response.cookies.set(
      SHOPIFY_SOURCE_STATE_COOKIE,
      serializeShopifySourceState({
        status: "syncing",
        shopDomain: shopMeta.myshopifyDomain,
        message: "Installed and waiting for first sync",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      }
    )
    response.cookies.delete(SHOPIFY_OAUTH_STATE_COOKIE)
    return response
  } catch {
    return withErrorState(redirectError("callback_failed"), {
      shopDomain: storedState.shopDomain,
      message: "Shopify callback processing failed",
    })
  }
}
