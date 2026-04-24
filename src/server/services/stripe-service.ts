import crypto from "node:crypto"

import { getOptionalSupabasePublicConfig } from "@/lib/supabase/shared"

interface StripeConfig {
  clientId: string
  secretKey: string
  appUrl: string
}

interface StripeWebhookConfig {
  webhookSecret: string
}

export const STRIPE_OAUTH_STATE_COOKIE = "checkoutleak_stripe_oauth_state"

interface StripeOauthStatePayload {
  nonce: string
  organizationId: string
  userEmail?: string | null
}

interface StripeWebhookSignature {
  timestamp: string | null
  signatures: string[]
}

export class StripeConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeConfigurationError"
  }
}

function getStripeConfig(): StripeConfig {
  const clientId = process.env.STRIPE_CLIENT_ID
  const secretKey = process.env.STRIPE_SECRET_KEY
  const appUrl = getStripeAppUrl()

  if (!clientId || !secretKey || !appUrl) {
    throw new StripeConfigurationError(
      "Missing Stripe connect config. Required env vars: STRIPE_CLIENT_ID, STRIPE_SECRET_KEY, and app URL."
    )
  }

  return {
    clientId,
    secretKey,
    appUrl,
  }
}

function getStripeWebhookConfig(): StripeWebhookConfig {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new StripeConfigurationError(
      "Missing Stripe webhook config. Required env var: STRIPE_WEBHOOK_SECRET."
    )
  }

  return { webhookSecret }
}

function getStripeAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (explicit) {
    return explicit
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  return null
}

function getStripeConnectSetupState() {
  const missing: string[] = []

  if (!process.env.STRIPE_CLIENT_ID) {
    missing.push("STRIPE_CLIENT_ID")
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    missing.push("STRIPE_SECRET_KEY")
  }
  if (!getStripeAppUrl()) {
    missing.push("NEXT_PUBLIC_APP_URL or APP_URL")
  }

  return {
    configured: missing.length === 0,
    missing,
  }
}

export function isStripeConfigured() {
  return getStripeConnectSetupState().configured
}

export function isStripeWebhookConfigured() {
  try {
    getStripeWebhookConfig()
    return true
  } catch {
    return false
  }
}

function buildConnectStateNonce() {
  return crypto.randomBytes(16).toString("hex")
}

export function createStripeConnectPayload(input: { organizationId: string }) {
  const config = getStripeConfig()
  const stateNonce = buildConnectStateNonce()
  const redirectUri = `${config.appUrl}/api/integrations/stripe/callback`
  const query = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    scope: "read_write",
    state: stateNonce,
    redirect_uri: redirectUri,
  })

  return {
    connectUrl: `https://connect.stripe.com/oauth/authorize?${query.toString()}`,
    stateNonce,
    organizationId: input.organizationId,
  }
}

export function serializeStripeOauthState(payload: StripeOauthStatePayload) {
  return JSON.stringify(payload)
}

export function parseStripeOauthState(raw: string | undefined) {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StripeOauthStatePayload>
    if (!parsed.nonce || !parsed.organizationId) {
      return null
    }

    return {
      nonce: parsed.nonce,
      organizationId: parsed.organizationId,
      userEmail:
        typeof parsed.userEmail === "string" && parsed.userEmail.trim()
          ? parsed.userEmail.trim().toLowerCase()
          : null,
    }
  } catch {
    return null
  }
}

export async function exchangeStripeCodeForToken(input: { code: string }) {
  const config = getStripeConfig()
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    client_secret: config.secretKey,
  })

  const response = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Stripe token exchange failed with status ${response.status}.`)
  }

  const payload = (await response.json()) as {
    access_token: string
    refresh_token?: string
    stripe_user_id: string
    scope?: string
    livemode?: boolean
  }

  if (!payload.access_token || !payload.stripe_user_id) {
    throw new Error("Stripe token response missing account details.")
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    stripeAccountId: payload.stripe_user_id,
    scope: payload.scope ?? "read_write",
    livemode: Boolean(payload.livemode),
  }
}

export async function fetchStripeAccountDetails(input: { accessToken: string }) {
  const response = await fetch("https://api.stripe.com/v1/account", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Stripe account fetch failed with status ${response.status}.`)
  }

  const payload = (await response.json()) as {
    id: string
    business_profile?: { name?: string | null }
    settings?: { dashboard?: { display_name?: string | null } }
  }

  const displayName =
    payload.business_profile?.name ??
    payload.settings?.dashboard?.display_name ??
    null

  return {
    id: payload.id,
    displayName,
  }
}

function parseStripeSignatureHeader(input: string | null): StripeWebhookSignature {
  if (!input) {
    return { timestamp: null, signatures: [] }
  }

  const parts = input.split(",")
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2) ?? null
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean)

  return { timestamp, signatures }
}

function secureCompareHex(input: string, signature: string) {
  const inputBuffer = Buffer.from(input, "hex")
  const signatureBuffer = Buffer.from(signature, "hex")

  if (inputBuffer.length !== signatureBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(inputBuffer, signatureBuffer)
}

export function verifyStripeWebhook(input: {
  rawBody: string
  signatureHeader: string | null
  toleranceSeconds?: number
}) {
  const webhookConfig = getStripeWebhookConfig()
  const toleranceSeconds = input.toleranceSeconds ?? 300
  const parsed = parseStripeSignatureHeader(input.signatureHeader)

  if (!parsed.timestamp || parsed.signatures.length === 0) {
    return false
  }

  const timestamp = Number(parsed.timestamp)
  if (!Number.isFinite(timestamp)) {
    return false
  }

  const nowInSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowInSeconds - timestamp) > toleranceSeconds) {
    return false
  }

  const signedPayload = `${parsed.timestamp}.${input.rawBody}`
  const expected = crypto
    .createHmac("sha256", webhookConfig.webhookSecret)
    .update(signedPayload)
    .digest("hex")

  return parsed.signatures.some((signature) => secureCompareHex(expected, signature))
}

export function getStripeSetupState() {
  const connect = getStripeConnectSetupState()
  const webhookConfigured = isStripeWebhookConfigured()
  const hasSupabase = Boolean(getOptionalSupabasePublicConfig())

  return {
    configured: connect.configured,
    missing: connect.missing,
    webhookConfigured,
    hasSupabase,
  }
}

export function getRecommendedStripeWebhookEvents() {
  return [
    "invoice.payment_failed",
    "invoice.paid",
    "payment_intent.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ] as const
}
