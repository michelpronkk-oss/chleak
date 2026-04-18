import crypto from "node:crypto"

import { z } from "zod"

const dodoCheckoutRequestSchema = z.object({
  planId: z.string().min(1),
  organizationId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
})

export type DodoCheckoutRequest = z.infer<typeof dodoCheckoutRequestSchema>

interface DodoConfig {
  apiKey: string
  checkoutSessionsUrl: string
  webhookSecret?: string
  webhookSignatureHeader: string
}

export class DodoConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DodoConfigurationError"
  }
}

export class DodoCheckoutRequestError extends Error {
  status: number
  upstreamBody: string | null

  constructor(input: { message: string; status: number; upstreamBody: string | null }) {
    super(input.message)
    this.name = "DodoCheckoutRequestError"
    this.status = input.status
    this.upstreamBody = input.upstreamBody
  }
}

function getDodoConfig(): DodoConfig {
  const apiKey = process.env.DODO_API_KEY
  const checkoutSessionsUrl = process.env.DODO_CHECKOUT_SESSIONS_URL
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET
  const webhookSignatureHeader =
    process.env.DODO_WEBHOOK_SIGNATURE_HEADER ?? "x-dodo-signature"

  if (!apiKey || !checkoutSessionsUrl) {
    throw new DodoConfigurationError(
      "Dodo billing is not configured. Add DODO_API_KEY and DODO_CHECKOUT_SESSIONS_URL."
    )
  }

  return { apiKey, checkoutSessionsUrl, webhookSecret, webhookSignatureHeader }
}

export function getDodoPublicConfig() {
  const configured = Boolean(
    process.env.DODO_API_KEY && process.env.DODO_CHECKOUT_SESSIONS_URL
  )
  return { configured }
}

function pickCheckoutUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const maybeUrlKeys = ["checkout_url", "checkoutUrl", "url", "payment_url"] as const
  for (const key of maybeUrlKeys) {
    const value = (payload as Record<string, unknown>)[key]
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

function pickSessionId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const maybeSessionKeys = ["id", "session_id", "sessionId"] as const
  for (const key of maybeSessionKeys) {
    const value = (payload as Record<string, unknown>)[key]
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  return null
}

function parseJsonSafely(input: string): unknown {
  try {
    return JSON.parse(input) as unknown
  } catch {
    return null
  }
}

export async function createDodoCheckoutSession(input: DodoCheckoutRequest) {
  const validated = dodoCheckoutRequestSchema.parse(input)
  const config = getDodoConfig()

  const response = await fetch(config.checkoutSessionsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [
        {
          product_id: validated.planId,
          quantity: 1,
        },
      ],
      customer: validated.customerEmail
        ? {
            email: validated.customerEmail,
          }
        : undefined,
      metadata: {
        organization_id: validated.organizationId,
      },
      return_url: validated.successUrl,
      cancel_url: validated.cancelUrl,
    }),
    cache: "no-store",
  })

  const responseText = await response.text().catch(() => "")
  const payload = responseText ? parseJsonSafely(responseText) : null

  if (!response.ok) {
    throw new DodoCheckoutRequestError({
      message: `Dodo checkout session request failed with status ${response.status}.`,
      status: response.status,
      upstreamBody: responseText || null,
    })
  }

  const checkoutUrl = pickCheckoutUrl(payload)
  const sessionId = pickSessionId(payload)

  if (!checkoutUrl) {
    throw new DodoCheckoutRequestError({
      message:
        "Dodo response did not include a checkout URL. Align the parser with your current Dodo API response shape.",
      status: response.status,
      upstreamBody: responseText || null,
    })
  }

  return {
    checkoutUrl,
    sessionId,
    raw: payload,
  }
}

export async function parseAndVerifyDodoWebhook(input: {
  rawBody: string
  signature: string | null
}) {
  const config = getDodoConfig()
  const payload = JSON.parse(input.rawBody) as Record<string, unknown>

  if (!config.webhookSecret) {
    return {
      verified: false,
      reason:
        "DODO_WEBHOOK_SECRET is not configured. Configure it before enabling webhook side-effects.",
      eventType:
        typeof payload.type === "string" ? payload.type : "unknown",
      payload,
    }
  }

  if (!input.signature) {
    return {
      verified: false,
      reason: `Missing signature header '${config.webhookSignatureHeader}'.`,
      eventType:
        typeof payload.type === "string" ? payload.type : "unknown",
      payload,
    }
  }

  const expected = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(input.rawBody)
    .digest("hex")

  const expectedBuffer = Buffer.from(expected)
  const incomingBuffer = Buffer.from(input.signature)

  if (expectedBuffer.length !== incomingBuffer.length) {
    return {
      verified: false,
      reason:
        "Webhook signature length mismatch. Confirm hashing strategy against current Dodo docs before production use.",
      eventType: typeof payload.type === "string" ? payload.type : "unknown",
      payload,
    }
  }

  const signaturesMatch = crypto.timingSafeEqual(
    expectedBuffer,
    incomingBuffer
  )

  return {
    verified: signaturesMatch,
    reason: signaturesMatch
      ? null
      : "Webhook signature mismatch. Confirm hashing strategy against current Dodo docs before production use.",
    eventType: typeof payload.type === "string" ? payload.type : "unknown",
    payload,
  }
}
