import { cookies } from "next/headers"

export const SHOPIFY_SOURCE_STATE_COOKIE = "checkoutleak_shopify_source_state"
export const STRIPE_SOURCE_STATE_COOKIE = "checkoutleak_stripe_source_state"
export const LIVE_SOURCE_CONTEXT_COOKIE = "checkoutleak_live_source_context"

export type SourceConnectionStatus =
  | "not_connected"
  | "connecting"
  | "connected"
  | "syncing"
  | "errored"

interface ShopifySourceStatePayload {
  status: SourceConnectionStatus
  shopDomain: string | null
  message: string | null
}

interface StripeSourceStatePayload {
  status: SourceConnectionStatus
  accountId: string | null
  message: string | null
}

interface LiveSourceContextPayload {
  url: string
  domain: string
  updatedAt: string
}

const defaultSourceState: ShopifySourceStatePayload = {
  status: "not_connected",
  shopDomain: null,
  message: null,
}

const defaultStripeSourceState: StripeSourceStatePayload = {
  status: "not_connected",
  accountId: null,
  message: null,
}

export async function getShopifySourceState(): Promise<ShopifySourceStatePayload> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SHOPIFY_SOURCE_STATE_COOKIE)?.value

  if (!raw) {
    return defaultSourceState
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ShopifySourceStatePayload>
    if (
      parsed.status !== "not_connected" &&
      parsed.status !== "connecting" &&
      parsed.status !== "connected" &&
      parsed.status !== "syncing" &&
      parsed.status !== "errored"
    ) {
      return defaultSourceState
    }

    return {
      status: parsed.status,
      shopDomain: parsed.shopDomain ?? null,
      message: parsed.message ?? null,
    }
  } catch {
    return defaultSourceState
  }
}

export function serializeShopifySourceState(payload: ShopifySourceStatePayload) {
  return JSON.stringify(payload)
}

export async function getStripeSourceState(): Promise<StripeSourceStatePayload> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(STRIPE_SOURCE_STATE_COOKIE)?.value

  if (!raw) {
    return defaultStripeSourceState
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StripeSourceStatePayload>
    if (
      parsed.status !== "not_connected" &&
      parsed.status !== "connecting" &&
      parsed.status !== "connected" &&
      parsed.status !== "syncing" &&
      parsed.status !== "errored"
    ) {
      return defaultStripeSourceState
    }

    return {
      status: parsed.status,
      accountId: parsed.accountId ?? null,
      message: parsed.message ?? null,
    }
  } catch {
    return defaultStripeSourceState
  }
}

export function serializeStripeSourceState(payload: StripeSourceStatePayload) {
  return JSON.stringify(payload)
}

export function serializeLiveSourceContext(payload: LiveSourceContextPayload) {
  return JSON.stringify(payload)
}

export function parseLiveSourceContext(raw: string | undefined) {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LiveSourceContextPayload>
    if (
      typeof parsed.url !== "string" ||
      parsed.url.trim().length === 0 ||
      typeof parsed.domain !== "string" ||
      parsed.domain.trim().length === 0
    ) {
      return null
    }

    return {
      url: parsed.url.trim(),
      domain: parsed.domain.trim().toLowerCase(),
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt.trim().length > 0
          ? parsed.updatedAt
          : null,
    }
  } catch {
    return null
  }
}
