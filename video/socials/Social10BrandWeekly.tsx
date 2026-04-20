/**
 * Social 10 — Brand · "Weekly Intelligence"
 * Shows the automated weekly digest. Monitoring-as-a-feature.
 * Best for: Instagram, LinkedIn, X
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { C, F } from "../components/tokens"

const rows = [
  { label: "Shipping step drop-off variance", impact: "$24,100", sev: "high" as const },
  { label: "iOS wallet coverage gap", impact: "$18,700", sev: "high" as const },
  { label: "Retry cadence underperforming", impact: "$16,100", sev: "medium" as const },
  { label: "Cross-border decline elevation", impact: "$9,200", sev: "medium" as const },
]

export function Social10BrandWeekly() {
  const logoSrc = useTransparentLogo("logo.png")

  return (
    <AbsoluteFill style={{
      background: C.bg,
      fontFamily: F.sans,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 56,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top bloom */}
      <div style={{
        position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 880, height: 500,
        background: "radial-gradient(ellipse, rgba(200,154,16,0.09) 0%, rgba(200,154,16,0.025) 50%, transparent 100%)",
        filter: "blur(100px)", pointerEvents: "none",
      }} />

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.22) 100%)",
        pointerEvents: "none",
      }} />

      {/* Headline */}
      <div style={{ textAlign: "center", marginBottom: 28, position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.amber, marginBottom: 14,
        }}>
          Automated monitoring
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 44, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.08, color: C.text,
        }}>
          Your store. Every week.
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 44, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.08, color: C.amber,
        }}>
          Automatically.
        </div>
      </div>

      {/* Weekly digest card */}
      <div style={{
        width: "100%",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Amber top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(to right, transparent, ${C.amber} 28%, ${C.amber} 72%, transparent)`,
        }} />

        {/* Digest header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", marginTop: 2, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber }} />
            <span style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>
              Weekly digest
            </span>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.06em" }}>
              Week of Apr 14
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.amber }}>
              auto
            </span>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{
          padding: "16px 24px", borderBottom: `1px solid ${C.border}`,
          background: "linear-gradient(180deg, rgba(200,154,16,0.05) 0%, transparent 60%)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textMuted, letterSpacing: "0.06em", marginBottom: 6 }}>
              Total exposure this week
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 36, fontWeight: 700, color: C.amber, letterSpacing: "-0.04em", lineHeight: 1 }}>
              $68,100
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.06em", marginBottom: 5 }}>
              4 active findings
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.06em" }}>
              Shopify + Stripe · no action taken
            </div>
          </div>
        </div>

        {/* Finding rows */}
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "13px 24px",
            borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : undefined,
          }}>
            <div style={{
              width: 2, height: 20, borderRadius: 2, flexShrink: 0,
              background: r.sev === "high" ? C.amber : C.sevMedium,
            }} />
            <span style={{ flex: 1, fontFamily: F.sans, fontSize: 13, color: C.text, letterSpacing: "-0.01em" }}>
              {r.label}
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 12, color: r.sev === "high" ? C.amber : C.textMuted }}>
              {r.impact}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{
        marginTop: 22, display: "flex", alignItems: "center", gap: 12,
        position: "relative", zIndex: 1,
      }}>
        {logoSrc && (
          <img src={logoSrc} style={{
            width: 20, height: 20, objectFit: "contain",
            filter: "drop-shadow(0 0 6px rgba(200,154,16,0.5))",
          }} />
        )}
        <span style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.08em" }}>
          checkoutleak.com · invite only
        </span>
      </div>
    </AbsoluteFill>
  )
}
