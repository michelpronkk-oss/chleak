/**
 * Social 7 — Personal X · "The Math"
 * Credibility via numbers. Founder voice, data-first.
 * Best for: X/Twitter personal, LinkedIn personal
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { C, F } from "../components/tokens"

export function Social7PersonalMath() {
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
      {/* Top-center bloom */}
      <div style={{
        position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 600,
        background: "radial-gradient(ellipse, rgba(200,154,16,0.08) 0%, rgba(200,154,16,0.025) 45%, transparent 100%)",
        filter: "blur(100px)", pointerEvents: "none",
      }} />

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.22) 100%)",
        pointerEvents: "none",
      }} />

      {/* Top label */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.textDim,
        }}>
          The math no one does
        </div>
      </div>

      {/* Calculation stack */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Row 1 */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.1em", marginBottom: 8 }}>
            STORE GMV
          </div>
          <div style={{
            fontFamily: F.mono, fontSize: 72, fontWeight: 700,
            letterSpacing: "-0.04em", lineHeight: 1, color: C.text,
          }}>
            $450k/mo
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: "100%", height: 1, margin: "28px 0",
          background: `linear-gradient(to right, ${C.border}, transparent 60%)`,
        }} />

        {/* Row 2 */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.1em", marginBottom: 8 }}>
            CHECKOUT COMPLETION GAP vs TOP QUARTILE
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{
              fontFamily: F.mono, fontSize: 72, fontWeight: 700,
              letterSpacing: "-0.04em", lineHeight: 1, color: C.textMuted,
            }}>
              68%
            </div>
            <div style={{
              fontFamily: F.mono, fontSize: 32, color: C.textDim,
              letterSpacing: "-0.02em",
            }}>
              vs 84%
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: "100%", height: 1, margin: "28px 0",
          background: `linear-gradient(to right, ${C.border}, transparent 60%)`,
        }} />

        {/* Result row */}
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.amber, letterSpacing: "0.1em", marginBottom: 8 }}>
            UNRECOVERED REVENUE
          </div>
          <div style={{
            fontFamily: F.mono, fontSize: 88, fontWeight: 700,
            letterSpacing: "-0.04em", lineHeight: 1, color: C.amber,
          }}>
            $72k/mo
          </div>
        </div>

        {/* Footnote */}
        <div style={{
          marginTop: 32,
          fontFamily: F.sans, fontSize: 17, fontWeight: 400,
          letterSpacing: "-0.02em", color: C.textMuted, lineHeight: 1.6,
        }}>
          Not from bad ads. From checkout gaps that<br />nobody measured.
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
