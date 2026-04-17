import crypto from "node:crypto"

import { getOptionalSupabasePublicConfig } from "@/lib/supabase/shared"

interface ShopifyConfig {
  apiKey: string
  apiSecret: string
  appUrl: string
  scopes: string[]
  webhookSecret: string
}

export const SHOPIFY_OAUTH_STATE_COOKIE = "checkoutleak_shopify_oauth_state"

interface ShopifyOauthStatePayload {
  nonce: string
  organizationId: string
  shopDomain: string
}

export class ShopifyConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ShopifyConfigurationError"
  }
}

function getShopifyConfig(): ShopifyConfig {
  const apiKey = process.env.SHOPIFY_API_KEY
  const apiSecret = process.env.SHOPIFY_API_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const scopesRaw =
    process.env.SHOPIFY_API_SCOPES ??
    "read_orders,read_checkouts,read_products,read_customers"
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (!apiKey || !apiSecret || !appUrl) {
    throw new ShopifyConfigurationError(
      "Missing Shopify config. Required env vars: SHOPIFY_API_KEY, SHOPIFY_API_SECRET, NEXT_PUBLIC_APP_URL."
    )
  }

  const scopes = scopesRaw
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean)

  return {
    apiKey,
    apiSecret,
    appUrl,
    scopes,
    webhookSecret: webhookSecret ?? apiSecret,
  }
}

export function isShopifyConfigured() {
  try {
    getShopifyConfig()
    return true
  } catch {
    return false
  }
}

export function normalizeShopDomain(input: string) {
  const value = input.trim().toLowerCase()
  const domain = value.startsWith("https://")
    ? value.replace("https://", "")
    : value

  if (!/^[a-z0-9-]+\.myshopify\.com$/.test(domain)) {
    throw new Error("Invalid Shopify domain. Use format: your-shop.myshopify.com")
  }

  return domain
}

function buildInstallStateNonce() {
  return crypto.randomBytes(16).toString("hex")
}

export function createShopifyInstallPayload({
  shopDomain,
  organizationId,
}: {
  shopDomain: string
  organizationId: string
}) {
  const config = getShopifyConfig()
  const stateNonce = buildInstallStateNonce()
  const redirectUri = `${config.appUrl}/api/integrations/shopify/callback`
  const query = new URLSearchParams({
    client_id: config.apiKey,
    scope: config.scopes.join(","),
    redirect_uri: redirectUri,
    state: stateNonce,
  })

  return {
    installUrl: `https://${shopDomain}/admin/oauth/authorize?${query.toString()}`,
    stateNonce,
    organizationId,
    shopDomain,
  }
}

export function serializeShopifyOauthState(payload: ShopifyOauthStatePayload) {
  return JSON.stringify(payload)
}

export function parseShopifyOauthState(raw: string | undefined) {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ShopifyOauthStatePayload>
    if (!parsed.nonce || !parsed.organizationId || !parsed.shopDomain) {
      return null
    }

    return {
      nonce: parsed.nonce,
      organizationId: parsed.organizationId,
      shopDomain: parsed.shopDomain,
    }
  } catch {
    return null
  }
}

export function verifyShopifyCallbackHmac(input: {
  queryParams: URLSearchParams
  receivedHmac: string | null
}) {
  const config = getShopifyConfig()

  if (!input.receivedHmac) {
    return false
  }

  const entries = Array.from(input.queryParams.entries())
    .filter(([key]) => key !== "hmac")
    .sort(([a], [b]) => a.localeCompare(b))

  const message = entries
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  const digest = crypto
    .createHmac("sha256", config.apiSecret)
    .update(message)
    .digest("hex")

  const digestBuffer = Buffer.from(digest)
  const receivedBuffer = Buffer.from(input.receivedHmac)
  if (digestBuffer.length !== receivedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(digestBuffer, receivedBuffer)
}

export async function exchangeShopifyCodeForToken(input: {
  shopDomain: string
  code: string
}) {
  const config = getShopifyConfig()
  const response = await fetch(`https://${input.shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.apiKey,
      client_secret: config.apiSecret,
      code: input.code,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Shopify token exchange failed with status ${response.status}.`)
  }

  const payload = (await response.json()) as {
    access_token: string
    scope?: string
  }

  return {
    accessToken: payload.access_token,
    scopes: payload.scope?.split(",").map((scope) => scope.trim()) ?? [],
  }
}

export async function fetchShopDetails(input: {
  shopDomain: string
  accessToken: string
}) {
  const response = await fetch(
    `https://${input.shopDomain}/admin/api/2024-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": input.accessToken,
      },
      body: JSON.stringify({
        query: `
          query ShopMeta {
            shop {
              id
              name
              myshopifyDomain
            }
          }
        `,
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Shopify shop query failed with status ${response.status}.`)
  }

  const payload = (await response.json()) as {
    data?: {
      shop?: {
        id: string
        name: string
        myshopifyDomain: string
      }
    }
  }

  const shop = payload.data?.shop
  if (!shop) {
    throw new Error("Shopify shop details missing from GraphQL response.")
  }

  return shop
}

export async function registerShopifyWebhooks(input: {
  shopDomain: string
  accessToken: string
}) {
  const config = getShopifyConfig()
  const endpoint = `${config.appUrl}/api/webhooks/shopify`
  const topics = ["ORDERS_CREATE", "APP_UNINSTALLED"] as const

  const results: Array<{ topic: string; success: boolean; userErrors: string[] }> = []

  for (const topic of topics) {
    const response = await fetch(
      `https://${input.shopDomain}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": input.accessToken,
        },
        body: JSON.stringify({
          query: `
            mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $callbackUrl: URL!) {
              webhookSubscriptionCreate(
                topic: $topic
                webhookSubscription: {
                  callbackUrl: $callbackUrl
                  format: JSON
                }
              ) {
                webhookSubscription {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: { topic, callbackUrl: endpoint },
        }),
        cache: "no-store",
      }
    )

    if (!response.ok) {
      results.push({
        topic,
        success: false,
        userErrors: [`Request failed with status ${response.status}`],
      })
      continue
    }

    const payload = (await response.json()) as {
      data?: {
        webhookSubscriptionCreate?: {
          webhookSubscription?: { id: string }
          userErrors?: Array<{ message: string }>
        }
      }
    }

    const userErrors =
      payload.data?.webhookSubscriptionCreate?.userErrors?.map((item) => item.message) ??
      []

    results.push({
      topic,
      success: Boolean(payload.data?.webhookSubscriptionCreate?.webhookSubscription),
      userErrors,
    })
  }

  return results
}

export function verifyShopifyWebhook(input: {
  rawBody: string
  receivedHmac: string | null
}) {
  const config = getShopifyConfig()
  if (!input.receivedHmac) {
    return false
  }

  const digest = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(input.rawBody)
    .digest("base64")

  const digestBuffer = Buffer.from(digest)
  const receivedBuffer = Buffer.from(input.receivedHmac)
  if (digestBuffer.length !== receivedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(digestBuffer, receivedBuffer)
}

export function getShopifySetupState() {
  const configured = isShopifyConfigured()
  const hasSupabase = Boolean(getOptionalSupabasePublicConfig())

  return { configured, hasSupabase }
}
