import { NextResponse } from "next/server"
import { z } from "zod"

import {
  DodoConfigurationError,
  createDodoCheckoutSession,
} from "@/lib/billing/dodo"
import { getAppOriginFromEnv } from "@/lib/auth/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureWorkspaceForUser } from "@/server/services/account-bootstrap-service"
import { createDodoCheckoutForPlan } from "@/server/services/dodo-billing-service"

const requestSchema = z.object({
  plan: z.enum(["starter", "growth", "pro"]).optional(),
  planId: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
})

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json())
    const appUrl = getAppOriginFromEnv() ?? new URL(request.url).origin
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      )
    }

    const metadata = user.user_metadata as Record<string, unknown> | null
    const fullName =
      typeof metadata?.full_name === "string" && metadata.full_name.trim().length > 0
        ? metadata.full_name.trim()
        : null
    const membership = await ensureWorkspaceForUser({
      userId: user.id,
      email: user.email ?? null,
      fullName,
    })

    const successUrl = `${appUrl}/app/billing?intent=checkout_success`
    const cancelUrl = `${appUrl}/app/billing?intent=checkout_cancelled`

    const session = payload.plan
      ? await createDodoCheckoutForPlan({
          plan: payload.plan,
          organizationId: membership.organizationId,
          customerEmail: payload.customerEmail ?? user.email ?? undefined,
          successUrl,
          cancelUrl,
        })
      : payload.planId
        ? await createDodoCheckoutSession({
            planId: payload.planId,
            organizationId: membership.organizationId,
            customerEmail: payload.customerEmail ?? user.email ?? undefined,
            successUrl,
            cancelUrl,
          })
        : null

    if (!session) {
      return NextResponse.json(
        { message: "Provide either plan or planId." },
        { status: 400 }
      )
    }

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
