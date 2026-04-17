import { NextResponse } from "next/server"

import { logStripeWebhookEvent } from "@/server/services/stripe-persistence-service"
import {
  getRecommendedStripeWebhookEvents,
  verifyStripeWebhook,
} from "@/server/services/stripe-service"

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  const accountHeader = request.headers.get("stripe-account")
  const rawBody = await request.text()

  try {
    const isValid = verifyStripeWebhook({
      rawBody,
      signatureHeader: signature,
    })

    if (!isValid) {
      return NextResponse.json(
        { received: false, message: "Invalid Stripe webhook signature." },
        { status: 401 }
      )
    }

    let payload: unknown = null
    try {
      payload = JSON.parse(rawBody)
    } catch {
      payload = { rawBody }
    }

    const eventType =
      typeof payload === "object" &&
      payload !== null &&
      "type" in payload &&
      typeof payload.type === "string"
        ? payload.type
        : "unknown"

    try {
      await logStripeWebhookEvent({
        accountId: accountHeader ?? null,
        topic: eventType,
        payload,
      })
    } catch {
      // Webhook ingestion should not fail hard when persistence is unavailable.
      // Stripe will retry according to webhook retry policy.
    }

    return NextResponse.json({
      received: true,
      eventType,
      monitoredTopics: getRecommendedStripeWebhookEvents(),
    })
  } catch {
    return NextResponse.json(
      { received: false, message: "Stripe webhook processing failed." },
      { status: 500 }
    )
  }
}
