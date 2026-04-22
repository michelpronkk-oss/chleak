/**
 * Social 14 — X Personal · "The Process"
 * How it works in 3 steps. Removes friction, kills objections.
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

const steps = [
  {
    n: "01",
    action: "Connect Shopify and Stripe",
    detail: "OAuth in 60 seconds. Read-only access. No code, no setup.",
  },
  {
    n: "02",
    action: "We scan your last 90 days",
    detail: "Checkout paths, payment methods, billing cadences — all surfaces.",
  },
  {
    n: "03",
    action: "You get ranked findings",
    detail: "Each leak has a dollar estimate, a root cause, and a next action.",
  },
]

export function Social14XProcess() {
  return (
    <AbsoluteFill style={{
      background: C.bg,
      fontFamily: F.sans,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 80,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.22) 100%)",
        pointerEvents: "none",
      }} />
      <SocialDotLayer />

      {/* Top label */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.textDim }}>
          Revenue intelligence
        </div>
      </div>

      {/* Headline + steps */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.sans, fontSize: 36, fontWeight: 700,
          letterSpacing: "-0.03em", lineHeight: 1.15, color: C.text,
          marginBottom: 48, maxWidth: 680,
        }}>
          How CheckoutLeak works.
          <br />
          <span style={{ color: C.textMuted, fontWeight: 400 }}>No dashboards to learn. No setup. Just findings.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              display: "flex", gap: 28, alignItems: "flex-start",
              padding: "24px 0",
              borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : undefined,
            }}>
              <div style={{
                fontFamily: F.mono, fontSize: 13, color: C.amber,
                letterSpacing: "0.06em", flexShrink: 0, width: 28, paddingTop: 3,
              }}>
                {s.n}
              </div>
              <div>
                <div style={{
                  fontFamily: F.sans, fontSize: 24, fontWeight: 600,
                  letterSpacing: "-0.025em", color: C.text, marginBottom: 6,
                }}>
                  {s.action}
                </div>
                <div style={{
                  fontFamily: F.sans, fontSize: 15, color: C.textMuted,
                  letterSpacing: "-0.01em", lineHeight: 1.6,
                }}>
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim }}>
          Founder · CheckoutLeak
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em" }}>
          checkoutleak.com
        </div>
      </div>
    </AbsoluteFill>
  )
}
