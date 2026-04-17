import { NextResponse } from "next/server"

import { parseAndVerifyDodoWebhook } from "@/lib/billing/dodo"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature =
    request.headers.get(
      process.env.DODO_WEBHOOK_SIGNATURE_HEADER ?? "x-dodo-signature"
    ) ?? request.headers.get("dodo-signature")

  try {
    const webhook = await parseAndVerifyDodoWebhook({
      rawBody,
      signature,
    })

    if (!webhook.verified) {
      return NextResponse.json(
        {
          received: true,
          verified: false,
          reason: webhook.reason,
        },
        { status: 202 }
      )
    }

    switch (webhook.eventType) {
      case "subscription.active":
      case "subscription.updated":
      case "subscription.canceled":
        return NextResponse.json({ received: true, handled: webhook.eventType })
      default:
        return NextResponse.json({
          received: true,
          handled: "noop",
          eventType: webhook.eventType,
        })
    }
  } catch {
    return NextResponse.json(
      { received: false, message: "Invalid webhook payload." },
      { status: 400 }
    )
  }
}
