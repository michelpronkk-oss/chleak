import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  ONBOARDING_STATE_COOKIE,
} from "@/server/services/onboarding-state-service"
import {
  enqueueShopifyQueuedScan,
  markShopifyIntegrationErrored,
  persistShopifyIntegration,
} from "@/server/services/shopify-persistence-service"
import { triggerQueuedScanTask } from "@/server/services/scan-task-service"
import {
  fetchShopifySignalSnapshot,
  SHOPIFY_OAUTH_STATE_COOKIE,
  exchangeShopifyCodeForToken,
  fetchShopDetails,
  parseShopifyOauthState,
  registerShopifyWebhooks,
  verifyShopifyCallbackHmac,
} from "@/server/services/shopify-service"
import {
  LIVE_SOURCE_CONTEXT_COOKIE,
  parseLiveSourceContext,
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
  const liveSourceContext = parseLiveSourceContext(
    cookieStore.get(LIVE_SOURCE_CONTEXT_COOKIE)?.value
  )

  console.info(
    `[shopify] OAuth callback received: shop=${shop}; state_present=${!!state}; hmac_present=${!!hmac}; cookie_present=${!!storedState}; stored_shop=${storedState?.shopDomain ?? "none"}; stored_nonce_prefix=${storedState?.nonce?.slice(0, 8) ?? "none"}`
  )

  const redirectError = (status: string) =>
    NextResponse.redirect(
      new URL(`/app/stores?provider=shopify&status=${status}`, url.origin)
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

  if (normalizedShop !== storedState.shopDomain) {
    console.warn(
      `[shopify] OAuth shop_domain_mismatch: stored_shop=${storedState.shopDomain}; callback_shop=${normalizedShop}; organization=${storedState.organizationId}; reason=proceeding_with_shopify_canonical_domain`
    )
  } else {
    console.info(
      `[shopify] OAuth shop_domain_verified: shop=${normalizedShop}; organization=${storedState.organizationId}`
    )
  }

  try {
    console.info(`[shopify] token exchange start: shop=${normalizedShop}`)
    const token = await exchangeShopifyCodeForToken({
      shopDomain: normalizedShop,
      code,
    })
    console.info(`[shopify] token exchange success: shop=${normalizedShop}; scopes=${token.scopes.join(",")}`)

    console.info(`[shopify] fetch shop details start: shop=${normalizedShop}`)
    const shopMeta = await fetchShopDetails({
      shopDomain: normalizedShop,
      accessToken: token.accessToken,
    })
    console.info(`[shopify] fetch shop details success: myshopify_domain=${shopMeta.myshopifyDomain}; name=${shopMeta.name}`)

    const signalSnapshot = await fetchShopifySignalSnapshot({
      shopDomain: shopMeta.myshopifyDomain,
      accessToken: token.accessToken,
    })
    console.info(
      `[shopify] signal snapshot: organization=${storedState.organizationId}; shop=${shopMeta.myshopifyDomain}; captured=${Boolean(signalSnapshot)}; orders_30d=${signalSnapshot?.ordersLast30Days ?? "n/a"}; total_orders=${signalSnapshot?.totalOrders ?? "n/a"}; products=${signalSnapshot?.products ?? "n/a"}; customers=${signalSnapshot?.customers ?? "n/a"}`
    )

    console.info(`[shopify] persist integration start: organization=${storedState.organizationId}; shop=${shopMeta.myshopifyDomain}`)
    const persistence = await persistShopifyIntegration({
      organizationId: storedState.organizationId,
      shopDomain: shopMeta.myshopifyDomain,
      preferredShopDomain: storedState.shopDomain,
      canonicalShopDomain: shopMeta.myshopifyDomain,
      primaryLiveSourceUrl: liveSourceContext?.url ?? null,
      primaryLiveSourceDomain: liveSourceContext?.domain ?? null,
      shopName: shopMeta.name,
      scopes: token.scopes,
      accessToken: token.accessToken,
      signalSnapshot,
    })
    console.info(`[shopify] persist integration success: organization=${storedState.organizationId}; shop=${shopMeta.myshopifyDomain}`)

    let queuedScanId = persistence.scanId
    if (!persistence.scanId) {
      console.warn(
        `[shopify] scan missing after persistence: organization=${storedState.organizationId}; store_id=${persistence.storeId}; reason=retrying_scan_insert`
      )
      const fallbackScanId = await enqueueShopifyQueuedScan({
        organizationId: storedState.organizationId,
        storeId: persistence.storeId,
      })
      if (!fallbackScanId) {
        console.error(
          `[shopify] scan insert retry failed: organization=${storedState.organizationId}; store_id=${persistence.storeId}`
        )
      } else {
        queuedScanId = fallbackScanId
      }
    }

    if (queuedScanId) {
      console.info(
        `[shopify] automatic scan trigger requested: organization=${storedState.organizationId}; scan_id=${queuedScanId}`
      )
      const triggerResult = await triggerQueuedScanTask({
        scanId: queuedScanId,
        organizationId: storedState.organizationId,
        storeId: persistence.storeId,
        provider: "shopify",
      })
      if (triggerResult.ok) {
        console.info(
          `[shopify] automatic scan trigger queued: organization=${storedState.organizationId}; scan_id=${queuedScanId}; task_id=${triggerResult.taskId}; run_id=${triggerResult.runId}`
        )
      } else {
        console.error(
          `[shopify] automatic scan trigger failed: organization=${storedState.organizationId}; scan_id=${queuedScanId}; reason=${triggerResult.reason}`
        )
      }
    } else {
      console.error(
        `[shopify] automatic scan processing skipped: organization=${storedState.organizationId}; reason=no_queued_scan_id`
      )
    }

    const webhookRegistration = await registerShopifyWebhooks({
      shopDomain: shopMeta.myshopifyDomain,
      accessToken: token.accessToken,
    })
    console.info(
      `[shopify] webhook registration start: organization=${storedState.organizationId}; store_id=${persistence.storeId}; integration_id=${persistence.integrationId}; registration_shop=${webhookRegistration.shopDomain}; canonical_shop=${shopMeta.myshopifyDomain}; display_shop=${storedState.shopDomain}; access_token_present=${Boolean(token.accessToken)}; api_version=${webhookRegistration.apiVersion}; topics=${webhookRegistration.topics.join(",")}; callback_endpoint=${webhookRegistration.endpoint}`
    )
    const webhookFailureResults = webhookRegistration.results.filter((result) => !result.success)
    const webhookFailure = webhookFailureResults.length > 0
    console.info(
      `[shopify] webhook registration done: organization=${storedState.organizationId}; store_id=${persistence.storeId}; integration_id=${persistence.integrationId}; registration_shop=${webhookRegistration.shopDomain}; failure=${webhookFailure}; results=${JSON.stringify(webhookRegistration.results.map((r) => ({ topic: r.topic, success: r.success, duplicate_detected: r.duplicateDetected, status_code: r.statusCode, user_errors: r.userErrors, webhook_id: r.webhookId, exception: r.exception, response_body: r.success ? null : r.responseBody })))}`
    )

    if (webhookFailure) {
      const failureDetails = webhookFailureResults
        .map(
          (failure) =>
            `topic=${failure.topic}; status=${failure.statusCode ?? "n/a"}; user_errors=${failure.userErrors.join(" | ") || "none"}; exception=${failure.exception ?? "none"}; response=${failure.responseBody ?? "none"}`
        )
        .join(" || ")
      const persistedReason = `Webhook registration failed during Shopify OAuth callback. ${failureDetails}`.slice(0, 3000)
      const uiMessage = `Webhook registration failed: ${failureDetails}`.slice(0, 800)

      await markShopifyIntegrationErrored({
        organizationId: storedState.organizationId,
        integrationId: persistence.integrationId,
        canonicalShopDomain: shopMeta.myshopifyDomain,
        reason: persistedReason,
      })
      console.error(
        `[shopify] webhook registration failed persisted: organization=${storedState.organizationId}; store_id=${persistence.storeId}; integration_id=${persistence.integrationId}; reason=${failureDetails}`
      )
      return withErrorState(redirectError("webhook_registration_failed"), {
        shopDomain: storedState.shopDomain,
        message: uiMessage,
      })
    }

    const response = NextResponse.redirect(
      new URL("/app/stores?provider=shopify&status=connected", url.origin)
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
        shopDomain: storedState.shopDomain,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[shopify] callback failed: shop=${normalizedShop}; organization=${storedState.organizationId}; error=${message}`)
    return withErrorState(redirectError("callback_failed"), {
      shopDomain: storedState.shopDomain,
      message: "Shopify callback processing failed",
    })
  }
}
