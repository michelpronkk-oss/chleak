import { NextResponse } from "next/server"

import { parseAndVerifyDodoWebhook } from "@/lib/billing/dodo"
import { createSupabaseAdminClient } from "@/lib/supabase/shared"
import { syncSubscriptionFromDodoWebhook } from "@/server/services/dodo-billing-service"
import type { Json } from "@/types/database"

function asRecord(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null
  }

  return input as Record<string, unknown>
}

function readString(source: Record<string, unknown> | null, keys: string[]) {
  if (!source) {
    return null
  }

  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  return null
}

function parseJsonSafely(rawBody: string) {
  try {
    return JSON.parse(rawBody) as unknown
  } catch {
    return null
  }
}

function asJson(input: unknown): Json {
  return input as Json
}

function resolveOrganizationId(payload: unknown) {
  const payloadRecord = asRecord(payload)
  const dataRecord = asRecord(payloadRecord?.data)
  const metadataRecord =
    asRecord(dataRecord?.metadata) ??
    asRecord(asRecord(dataRecord?.subscription)?.metadata) ??
    asRecord(payloadRecord?.metadata)

  return (
    readString(metadataRecord, ["organization_id", "organizationId"]) ??
    readString(dataRecord, ["organization_id", "organizationId"]) ??
    readString(payloadRecord, ["organization_id", "organizationId"])
  )
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const webhookId = request.headers.get("webhook-id")
  const webhookTimestamp = request.headers.get("webhook-timestamp")
  const webhookSignature = request.headers.get("webhook-signature")
  const parsedPayload = parseJsonSafely(rawBody)
  const parsedRecord = asRecord(parsedPayload)
  const eventType =
    typeof parsedRecord?.type === "string" && parsedRecord.type.length > 0
      ? parsedRecord.type
      : "unknown"
  const organizationId = resolveOrganizationId(parsedPayload)

  console.info(
    `[billing] Dodo webhook received: event=${eventType}; organization=${organizationId ?? "unknown"}; webhook-id=${webhookId ?? "none"}`
  )
  let loggedEventId: string | null = null

  try {
    const admin = createSupabaseAdminClient()
    const insertResult = await admin
      .from("integration_webhook_events")
      .insert({
        organization_id: organizationId,
        provider: "dodo",
        source_domain: null,
        topic: eventType,
        payload: asJson(
          parsedPayload ?? {
            raw_body: rawBody,
            parse_error: "invalid_json",
          }
        ),
      })
      .select("id")
      .single()

    if (insertResult.error) {
      console.error(
        `[billing] Dodo webhook event persist failed: ${insertResult.error.message}`
      )
    } else {
      loggedEventId = insertResult.data.id
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown"
    console.error(`[billing] Dodo webhook event persist threw: ${message}`)
  }

  try {
    const webhook = await parseAndVerifyDodoWebhook({
      rawBody,
      webhookId,
      webhookTimestamp,
      webhookSignature,
    })

    if (!webhook.verified) {
      console.warn(
        `[billing] Dodo webhook not verified: event=${eventType}; reason=${webhook.reason ?? "unknown"}`
      )
      return NextResponse.json(
        {
          received: true,
          verified: false,
          reason: webhook.reason,
        },
        { status: 202 }
      )
    }

    console.info(
      `[billing] Dodo webhook verified: event=${webhook.eventType}; organization=${organizationId ?? "unknown"}`
    )

    const sync = await syncSubscriptionFromDodoWebhook({
      eventType: webhook.eventType,
      payload: webhook.payload,
    })

    if (sync.applied) {
      console.info(
        `[billing] Dodo subscription synced: event=${webhook.eventType}; organization=${sync.organizationId}; plan=${sync.plan}; status=${sync.status}`
      )
    } else {
      console.error(
        `[billing] Dodo webhook sync not applied: event=${webhook.eventType}; reason=${sync.reason}; organization=${sync.organizationId ?? "unknown"}`
      )
    }

    if (sync.applied && loggedEventId) {
      const admin = createSupabaseAdminClient()
      const processedAt = new Date().toISOString()
      const processedUpdate = await admin
        .from("integration_webhook_events")
        .update({ processed_at: processedAt })
        .eq("id", loggedEventId)

      if (processedUpdate.error) {
        console.error(
          `[billing] Failed to mark webhook as processed: event_id=${loggedEventId}; reason=${processedUpdate.error.message}`
        )
      } else {
        console.info(
          `[billing] Webhook event marked processed: event_id=${loggedEventId}`
        )
      }
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown"
    console.error(`[billing] Dodo webhook processing failed: ${message}`)
    return NextResponse.json(
      { received: false, message: "Webhook processing failed." },
      { status: 500 }
    )
  }
}
