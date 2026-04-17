import { NextResponse } from "next/server"

import { logShopifyWebhookEvent } from "@/server/services/shopify-persistence-service"
import { verifyShopifyWebhook } from "@/server/services/shopify-service"

export async function POST(request: Request) {
  const topic = request.headers.get("x-shopify-topic") ?? "unknown"
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "unknown"
  const hmac = request.headers.get("x-shopify-hmac-sha256")
  const rawBody = await request.text()

  try {
    const isValid = verifyShopifyWebhook({
      rawBody,
      receivedHmac: hmac,
    })

    if (!isValid) {
      return NextResponse.json(
        { received: false, message: "Invalid Shopify webhook signature." },
        { status: 401 }
      )
    }

    let payload: unknown = null
    try {
      payload = JSON.parse(rawBody)
    } catch {
      payload = { rawBody }
    }

    try {
      await logShopifyWebhookEvent({
        shopDomain,
        topic,
        payload,
      })
    } catch {
      // Webhook ingestion should not fail hard when persistence is unavailable.
      // The event can be replayed by Shopify according to retry policy.
    }

    return NextResponse.json({ received: true, topic })
  } catch {
    return NextResponse.json(
      { received: false, message: "Shopify webhook processing failed." },
      { status: 500 }
    )
  }
}
