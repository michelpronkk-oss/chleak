/**
 * Social 6 — Personal X · "The Contrarian"
 * Hot take. For founder's personal account.
 * Best for: X/Twitter personal, LinkedIn personal
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

export function Social6PersonalContrarian() {
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
      {/* Left-side bloom */}
      <div style={{
        position: "absolute", left: -280, top: "15%",
        width: 800, height: 800,
        background: "radial-gradient(circle, rgba(200,154,16,0.07) 0%, rgba(200,154,16,0.025) 45%, rgba(200,154,16,0.005) 70%, transparent 100%)",
        filter: "blur(120px)", pointerEvents: "none",
      }} />

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

      {/* Statement */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Vertical amber rule + text */}
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <div style={{
            width: 2, height: 220, flexShrink: 0,
            background: `linear-gradient(to bottom, ${C.amber} 0%, transparent 100%)`,
            marginTop: 4,
          }} />
          <div>
            <div style={{
              fontFamily: F.sans, fontSize: 60, fontWeight: 700,
              letterSpacing: "-0.04em", lineHeight: 1.07, color: C.text,
            }}>
              Everyone A/B tests<br />the headline.
            </div>
            <div style={{
              marginTop: 12,
              fontFamily: F.sans, fontSize: 60, fontWeight: 700,
              letterSpacing: "-0.04em", lineHeight: 1.07, color: C.textMuted,
            }}>
              Few test if checkout<br />actually works.
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{
          width: 40, height: 1, margin: "40px 0 32px",
          background: `linear-gradient(to right, ${C.amber}, transparent)`,
        }} />

        <div style={{
          fontFamily: F.sans, fontSize: 20, fontWeight: 400,
          letterSpacing: "-0.02em", color: C.textMuted, lineHeight: 1.6,
          maxWidth: 560,
        }}>
          Revenue leaks at the bottom of the funnel.
          <br />That's where the quiet losses live.
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
