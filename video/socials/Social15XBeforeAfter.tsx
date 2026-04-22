/**
 * Social 15 — X Personal · "Before / After"
 * Two-state card. Shows the difference in clarity, not features.
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

export function Social15XBeforeAfter() {
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

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.sans, fontSize: 34, fontWeight: 700,
          letterSpacing: "-0.03em", lineHeight: 1.15, color: C.text,
          marginBottom: 44,
        }}>
          Two ways to know your<br />conversion rate is 2.1%.
        </div>

        {/* Before card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "22px 28px", marginBottom: 14,
        }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim, marginBottom: 12 }}>
            Before
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 20, color: C.textMuted, letterSpacing: "-0.02em", lineHeight: 1.55 }}>
            "Our conversion rate is 2.1%."
          </div>
        </div>

        {/* After card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "22px 28px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Amber accent */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(to right, transparent, ${C.amber} 28%, ${C.amber} 72%, transparent)`,
          }} />
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.amber, marginBottom: 12, marginTop: 2 }}>
            After
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 20, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.65 }}>
            "It's 2.1% because mobile drops off at shipping,
            iOS has no wallet options, and our retry sequence
            gives up after one attempt."
          </div>
        </div>

        <div style={{
          marginTop: 32, fontFamily: F.sans, fontSize: 17,
          letterSpacing: "-0.02em", color: C.textMuted, lineHeight: 1.6,
        }}>
          Different kind of knowing.{" "}
          <span style={{ color: C.amber }}>Different kind of fixing.</span>
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
