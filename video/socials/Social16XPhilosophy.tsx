/**
 * Social 16 — X Personal · "The Philosophy"
 * Pure conviction. No numbers, no product. Just the idea.
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

export function Social16XPhilosophy() {
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

      {/* Statement */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Vertical rule */}
        <div style={{
          width: 2, height: 56, marginBottom: 40,
          background: `linear-gradient(to bottom, ${C.amber}, transparent)`,
        }} />

        <div style={{
          fontFamily: F.sans, fontSize: 58, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.07, color: C.text,
          marginBottom: 12,
        }}>
          Revenue intelligence
          isn't about more data.
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 58, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.07, color: C.textMuted,
        }}>
          It's about the
          right question.
        </div>

        {/* Separator */}
        <div style={{
          width: 40, height: 1, margin: "44px 0 36px",
          background: `linear-gradient(to right, ${C.amber}, transparent)`,
        }} />

        <div style={{
          fontFamily: F.sans, fontSize: 30, fontWeight: 600,
          letterSpacing: "-0.03em", color: C.amber, lineHeight: 1.3,
          marginBottom: 16,
        }}>
          Where, exactly, is my money going?
        </div>

        <div style={{
          fontFamily: F.sans, fontSize: 18, fontWeight: 400,
          letterSpacing: "-0.02em", color: C.textMuted, lineHeight: 1.6,
          maxWidth: 560,
        }}>
          That's it. Answer that and the recovery follows.
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
