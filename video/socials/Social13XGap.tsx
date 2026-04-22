/**
 * Social 13 — X Personal · "The Gap"
 * iOS vs desktop conversion data. Specific, credible, stops the scroll.
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

export function Social13XGap() {
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
          Checkout signal
        </div>
      </div>

      {/* Data stack */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Row 1 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            iOS checkout completion
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 100, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: C.textMuted }}>
            61%
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, ${C.border}, transparent 60%)`, marginBottom: 32 }} />

        {/* Row 2 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            Desktop checkout completion
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 100, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: C.textMuted }}>
            84%
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: `linear-gradient(to right, ${C.border}, transparent 60%)`, marginBottom: 32 }} />

        {/* Result */}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.amber, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            On a $300k/mo store — the gap is worth
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 80, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, color: C.amber }}>
            $18k/mo
          </div>
        </div>

        <div style={{
          marginTop: 32, fontFamily: F.sans, fontSize: 17, fontWeight: 400,
          letterSpacing: "-0.02em", color: C.textMuted, lineHeight: 1.6,
        }}>
          Missing wallet options. Not a traffic problem.
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
