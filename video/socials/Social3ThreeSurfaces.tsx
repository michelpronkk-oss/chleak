/**
 * Social 3 — "Three Surfaces"
 * Educational. Shows the three signal families with real findings.
 * Best for: carousel first frame, LinkedIn, Facebook awareness
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

const surfaces = [
  {
    family: "Checkout",
    tag: "Conversion intelligence",
    finding: "Shipping step drop-off variance",
    impact: "$24,100 / mo",
    detail: "Step-level breaks by device and market — quantified as monthly exposure.",
    sev: "high" as const,
  },
  {
    family: "Payments",
    tag: "Coverage analysis",
    finding: "iOS wallet coverage gap",
    impact: "$18,700 / mo",
    detail: "Method gaps mapped against live traffic composition.",
    sev: "high" as const,
  },
  {
    family: "Billing",
    tag: "Recovery surfaces",
    finding: "Retry cadence underperforming",
    impact: "$16,100 / mo",
    detail: "Dunning inefficiency turned into a ranked, recoverable line item.",
    sev: "medium" as const,
  },
]

export function Social3ThreeSurfaces() {
  const logoSrc = useTransparentLogo("logo.png")

  return (
    <AbsoluteFill style={{
      background: C.bg,
      fontFamily: F.sans,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "56px 52px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top bloom */}
      <div style={{
        position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 960, height: 440,
        background: "radial-gradient(50% 45% at 50% 0%, rgba(200,154,16,0.09), transparent 100%)",
        filter: "blur(72px)", pointerEvents: "none",
      }} />

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 54%, rgba(0,0,0,0.20) 100%)",
        pointerEvents: "none",
      }} />
      <SocialDotLayer />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.amber, marginBottom: 14,
        }}>
          Three signal families
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 44, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.08, color: C.text,
        }}>
          Where revenue leaks.
        </div>
        <div style={{
          marginTop: 10, fontFamily: F.sans, fontSize: 15,
          color: C.textMuted, letterSpacing: "-0.01em",
        }}>
          One system. Every surface. Ranked by exposure.
        </div>
      </div>

      {/* Three cards */}
      <div style={{
        display: "flex", gap: 14, width: "100%",
        position: "relative", zIndex: 1,
      }}>
        {surfaces.map((s) => (
          <div key={s.family} style={{
            flex: 1,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Amber top accent — high sev only */}
            {s.sev === "high" && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(to right, transparent, ${C.amber} 28%, ${C.amber} 72%, transparent)`,
              }} />
            )}

            {/* Card body */}
            <div style={{ padding: "24px 24px 20px", marginTop: s.sev === "high" ? 2 : 0, flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Tag */}
              <div style={{
                fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
                textTransform: "uppercase", color: C.textDim, marginBottom: 12,
              }}>
                {s.tag}
              </div>

              {/* Family name */}
              <div style={{
                fontFamily: F.sans, fontSize: 30, fontWeight: 700,
                letterSpacing: "-0.03em", color: C.text, marginBottom: 20,
              }}>
                {s.family}
              </div>

              {/* Finding badge */}
              <div style={{
                padding: "12px 14px",
                background: "rgba(255,255,255,0.028)",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                  <div style={{
                    width: 2, height: 14, borderRadius: 2, flexShrink: 0,
                    background: s.sev === "high" ? C.amber : C.sevMedium,
                  }} />
                  <span style={{ fontFamily: F.sans, fontSize: 12, color: C.text, letterSpacing: "-0.01em", lineHeight: 1.4 }}>
                    {s.finding}
                  </span>
                </div>
                <div style={{
                  fontFamily: F.mono, fontSize: 15, fontWeight: 600,
                  color: s.sev === "high" ? C.amber : C.textMuted,
                  letterSpacing: "-0.01em", paddingLeft: 12,
                }}>
                  {s.impact}
                </div>
              </div>

              {/* Detail text */}
              <div style={{
                fontFamily: F.sans, fontSize: 12, color: C.textMuted,
                lineHeight: 1.65, flex: 1,
              }}>
                {s.detail}
              </div>
            </div>

            {/* Card footer */}
            <div style={{
              padding: "10px 24px",
              borderTop: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim, letterSpacing: "0.06em" }}>
                Ranked finding
              </span>
              <span style={{
                fontFamily: F.mono, fontSize: 10, letterSpacing: "0.08em",
                textTransform: "uppercase", color: s.sev === "high" ? C.amber : C.textDim,
              }}>
                {s.sev}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{
        marginTop: 24, display: "flex", alignItems: "center", gap: 12,
        position: "relative", zIndex: 1,
      }}>
        {logoSrc && (
          <img src={logoSrc} style={{
            width: 20, height: 20, objectFit: "contain",
            filter: "drop-shadow(0 0 6px rgba(200,154,16,0.5))",
          }} />
        )}
        <span style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.08em" }}>
          checkoutleak.com · revenue intelligence
        </span>
      </div>
    </AbsoluteFill>
  )
}
