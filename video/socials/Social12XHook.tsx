/**
 * Social 12 — X Personal · "The Hook"
 * FOMO opener. Makes the problem feel real and immediate.
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

export function Social12XHook() {
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
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.textDim,
        }}>
          Revenue intelligence
        </div>
      </div>

      {/* Main statement */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.sans, fontSize: 52, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.07, color: C.text,
          marginBottom: 28,
        }}>
          If your store does $500k/mo
          and you haven't audited
          your checkout —
        </div>

        <div style={{
          fontFamily: F.sans, fontSize: 52, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.07, color: C.amber,
        }}>
          you're probably leaving
          $40k+ on the table.
          Every month.
        </div>

        {/* Separator */}
        <div style={{
          width: 40, height: 1, margin: "36px 0 28px",
          background: `linear-gradient(to right, ${C.amber}, transparent)`,
        }} />

        <div style={{
          fontFamily: F.sans, fontSize: 18, fontWeight: 400,
          letterSpacing: "-0.02em", color: C.textMuted, lineHeight: 1.6,
          maxWidth: 580,
        }}>
          Not from bad ads. Not from poor product. From gaps
          that nobody measured.
        </div>
      </div>

      {/* Attribution */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 1,
      }}>
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
