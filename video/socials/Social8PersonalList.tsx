/**
 * Social 8 — Personal X · "The Audit List"
 * Pattern recognition. Shows recurring gaps across stores.
 * Best for: X/Twitter personal, LinkedIn personal
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

const items = [
  { n: "01", text: "Mobile drop-off at the shipping step" },
  { n: "02", text: "iOS sessions without wallet options" },
  { n: "03", text: "Retry sequences that quit too early" },
  { n: "04", text: "Cross-border currency friction" },
]

export function Social8PersonalList() {
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

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Headline */}
        <div style={{
          fontFamily: F.sans, fontSize: 32, fontWeight: 700,
          letterSpacing: "-0.03em", lineHeight: 1.2, color: C.text,
          marginBottom: 48,
          maxWidth: 680,
        }}>
          After auditing dozens of Shopify checkouts,<br />
          the same 4 gaps keep appearing:
        </div>

        {/* List items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((item, i) => (
            <div key={item.n} style={{
              display: "flex", alignItems: "center", gap: 24,
              padding: "20px 0",
              borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : undefined,
            }}>
              <span style={{
                fontFamily: F.mono, fontSize: 13, color: C.textDim,
                letterSpacing: "0.08em", flexShrink: 0, width: 28,
              }}>
                {item.n}
              </span>
              <span style={{
                fontFamily: F.sans, fontSize: 26, fontWeight: 600,
                letterSpacing: "-0.03em", color: C.text, lineHeight: 1.2,
              }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Insight line */}
        <div style={{
          marginTop: 40,
          fontFamily: F.sans, fontSize: 20, fontWeight: 400,
          letterSpacing: "-0.02em", color: C.textMuted, lineHeight: 1.55,
        }}>
          Different stores. Same 4 gaps.{" "}
          <span style={{ color: C.amber }}>Every time.</span>
        </div>
      </div>

      {/* Bottom attribution */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
          textTransform: "uppercase", color: C.textDim,
        }}>
          Founder · CheckoutLeak
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
