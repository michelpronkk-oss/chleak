import { NextResponse } from "next/server"
import { z } from "zod"

import {
  DodoConfigurationError,
  createDodoCheckoutSession,
} from "@/lib/billing/dodo"

const requestSchema = z.object({
  planId: z.string().min(1),
  organizationId: z.string().min(1),
  customerEmail: z.string().email().optional(),
})

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json())
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

    const session = await createDodoCheckoutSession({
      planId: payload.planId,
      organizationId: payload.organizationId,
      customerEmail: payload.customerEmail,
      successUrl: `${appUrl}/app?billing=success`,
      cancelUrl: `${appUrl}/#pricing`,
    })

    return NextResponse.json({
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
    })
  } catch (error) {
    if (error instanceof DodoConfigurationError) {
      return NextResponse.json(
        {
          message: error.message,
          code: "dodo_not_configured",
        },
        { status: 503 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid checkout payload.", issues: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message:
          "Unable to create Dodo checkout session. Verify endpoint shape and credentials.",
      },
      { status: 500 }
    )
  }
}
