import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { getEntitlementsForOrganization } from "@/server/services/entitlement-service"
import {
  ONBOARDING_STATE_COOKIE,
} from "@/server/services/onboarding-state-service"
import {
  SHOPIFY_OAUTH_STATE_COOKIE,
  createShopifyInstallPayload,
  getShopifySetupState,
  normalizeShopDomain,
  parseShopifyOauthState,
  serializeShopifyOauthState,
} from "@/server/services/shopify-service"
import {
  SHOPIFY_SOURCE_STATE_COOKIE,
  serializeShopifySourceState,
} from "@/server/services/source-connection-state-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const shop = url.searchParams.get("shop")

  console.info(`[shopify] install route hit: shop=${shop ?? "none"}`)

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.info(`[shopify] install early_return: reason=unauthenticated; shop=${shop ?? "none"}`)
    const signInUrl = new URL("/auth/sign-in", url.origin)
    signInUrl.searchParams.set("next", "/app/stores?provider=shopify")
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
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[shopify] install early_return: reason=workspace_error; shop=${shop ?? "none"}; user=${user.id}; error=${errMsg}`)
    return NextResponse.redirect(
      new URL("/app/stores?provider=shopify&status=callback_failed", url.origin)
    )
  }
  const organizationId = membership.organizationId
  const entitlements = await getEntitlementsForOrganization(organizationId)
  if (!entitlements.isActive || !entitlements.canUseShopifyEnrichment) {
    return NextResponse.redirect(
      new URL("/app/stores?provider=shopify&status=plan_upgrade_required", url.origin)
    )
  }

  const setup = getShopifySetupState()
  if (!setup.configured) {
    console.warn(`[shopify] install early_return: reason=not_configured; shop=${shop ?? "none"}; organization=${organizationId}`)
    return NextResponse.redirect(
      new URL("/app/stores?provider=shopify&status=setup_required", url.origin)
    )
  }

  if (!shop) {
    console.warn(`[shopify] install early_return: reason=missing_shop; organization=${organizationId}`)
    return NextResponse.redirect(
      new URL("/app/stores?provider=shopify&status=invalid_shop", url.origin)
    )
  }

  try {
    const shopDomain = normalizeShopDomain(shop)

    const cookieStore = await cookies()
    const existingState = parseShopifyOauthState(
      cookieStore.get(SHOPIFY_OAUTH_STATE_COOKIE)?.value
    )
    if (existingState) {
      if (existingState.shopDomain !== shopDomain) {
        console.warn(
          `[shopify] install stale_state_overwrite: new_shop=${shopDomain}; stale_shop=${existingState.shopDomain}; stale_nonce_prefix=${existingState.nonce.slice(0, 8)}; organization=${organizationId}`
        )
      } else {
        console.info(
          `[shopify] install retry_same_shop: shop=${shopDomain}; stale_nonce_prefix=${existingState.nonce.slice(0, 8)}; organization=${organizationId}`
        )
      }
    }

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
      userEmail: user.email ?? null,
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
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error(`[shopify] install early_return: reason=install_error; shop=${shop}; organization=${organizationId}; error=${errMsg}`)
    const fallback = new URL("/app/stores?provider=shopify&status=invalid_shop", url.origin)
    fallback.searchParams.set("shop", shop)
    return NextResponse.redirect(fallback)
  }
}
