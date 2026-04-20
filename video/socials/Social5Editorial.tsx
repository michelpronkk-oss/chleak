/**
 * Social 5 — "The Editorial"
 * Pure typography. No UI, no numbers. Conversation-starting.
 * Best for: X/Twitter, opinion posts, brand awareness
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { C, F } from "../components/tokens"

const lines = [
  { text: "Checkout drop-off.", color: C.text },
  { text: "Payment gaps.", color: C.text },
  { text: "Failed renewals.", color: C.amber },
]

export function Social5Editorial() {
  const logoSrc = useTransparentLogo("logo.png")

  return (
    <AbsoluteFill style={{
      background: C.bg,
      fontFamily: F.sans,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 72,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Right-side bloom — oversized so edges never land on canvas */}
      <div style={{
        position: "absolute", right: -320, top: "10%",
        width: 900, height: 900,
        background: "radial-gradient(circle, rgba(200,154,16,0.09) 0%, rgba(200,154,16,0.04) 40%, rgba(200,154,16,0.01) 65%, transparent 100%)",
        filter: "blur(120px)", pointerEvents: "none",
      }} />

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.18) 100%)",
        pointerEvents: "none",
      }} />

      {/* Top — wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
        {logoSrc && (
          <img src={logoSrc} style={{
            width: 28, height: 28, objectFit: "contain",
            filter: "drop-shadow(0 0 8px rgba(200,154,16,0.5))",
          }} />
        )}
        <span style={{
          fontFamily: F.mono, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.18em", textTransform: "uppercase", color: C.textDim,
        }}>
          CHECKOUTLEAK
        </span>
      </div>

      {/* Center — the statement */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.12em",
          textTransform: "uppercase", color: C.textMuted, marginBottom: 32,
        }}>
          Three reasons revenue leaks.
        </div>

        {/* Bold lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lines.map((line) => (
            <div key={line.text} style={{
              fontFamily: F.sans, fontSize: 76, fontWeight: 700,
              letterSpacing: "-0.05em", lineHeight: 1.05, color: line.color,
            }}>
              {line.text}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{
          width: 48, height: 1, margin: "40px 0",
          background: `linear-gradient(to right, ${C.amber}, transparent)`,
        }} />

        {/* Payoff */}
        <div style={{
          fontFamily: F.sans, fontSize: 28, fontWeight: 600,
          letterSpacing: "-0.025em", color: C.text, lineHeight: 1.35,
          maxWidth: 540,
        }}>
          Every dollar. Ranked.
          <br />
          <span style={{ color: C.textMuted, fontWeight: 400 }}>Ready to recover.</span>
        </div>
      </div>

      {/* Bottom — attribution */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.1em",
          textTransform: "uppercase", color: C.textDim,
        }}>
          Revenue Intelligence
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em",
        }}>
          checkoutleak.com
        </div>
      </div>
    </AbsoluteFill>
  )
}
