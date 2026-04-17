import { NextResponse } from "next/server"

import { parseAndVerifyDodoWebhook } from "@/lib/billing/dodo"
import { syncSubscriptionFromDodoWebhook } from "@/server/services/dodo-billing-service"

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

    const sync = await syncSubscriptionFromDodoWebhook({
      eventType: webhook.eventType,
      payload: webhook.payload,
    })

    return NextResponse.json({
      received: true,
      verified: true,
      handled: webhook.eventType,
      applied: sync.applied,
      reason: sync.reason,
      organizationId: sync.organizationId ?? null,
      plan: sync.plan ?? null,
      status: sync.status ?? null,
    })
  } catch {
    return NextResponse.json(
      { received: false, message: "Invalid webhook payload." },
      { status: 400 }
    )
  }
}
