/**
 * Social 4 — "The Action Brief"
 * Credibility post. Shows the depth of a single finding.
 * Best for: X/Twitter thread first image, LinkedIn, building trust
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { C, F } from "../components/tokens"

function DetailRow({ label, value, valueColor = C.text }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{
      padding: "16px 24px",
      borderBottom: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", gap: 7,
    }}>
      <div style={{
        fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
        textTransform: "uppercase", color: C.textDim,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: F.sans, fontSize: 14, color: valueColor,
        lineHeight: 1.55, letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
    </div>
  )
}

export function Social4ActionBrief() {
  const logoSrc = useTransparentLogo("logo.png")

  return (
    <AbsoluteFill style={{
      background: C.bg,
      fontFamily: F.sans,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "56px 64px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top bloom */}
      <div style={{
        position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 800, height: 420,
        background: "radial-gradient(50% 45% at 50% 0%, rgba(200,154,16,0.09), transparent 100%)",
        filter: "blur(64px)", pointerEvents: "none",
      }} />

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 54%, rgba(0,0,0,0.20) 100%)",
        pointerEvents: "none",
      }} />

      {/* Headline */}
      <div style={{ textAlign: "center", marginBottom: 28, position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.amber, marginBottom: 14,
        }}>
          Finding detail
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 40, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.1, color: C.text,
        }}>
          This is what a
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 40, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.1, color: C.amber,
        }}>
          revenue leak looks like.
        </div>
      </div>

      {/* Finding card */}
      <div style={{
        width: "100%",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Amber top accent */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(to right, transparent, ${C.amber} 28%, ${C.amber} 72%, transparent)`,
        }} />

        {/* Card header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", marginTop: 2, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber, opacity: 0.9 }} />
            <span style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>
              Revenue intelligence
            </span>
          </div>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.12em",
            textTransform: "uppercase", color: C.amber,
            padding: "3px 10px", background: "rgba(200,154,16,0.08)",
            borderRadius: 4, border: "1px solid rgba(200,154,16,0.22)",
          }}>
            HIGH
          </div>
        </div>

        <DetailRow label="Finding" value="iOS wallet coverage gap" />
        <DetailRow
          label="Root cause"
          value="Apple Pay and Google Pay are absent from the mobile checkout path. High-intent sessions on iOS complete at 61% vs 84% on desktop — a 23pp conversion gap attributable to missing wallet options."
        />
        <DetailRow
          label="Estimated monthly impact"
          value="$18,700 / mo"
          valueColor={C.amber}
        />
        <DetailRow
          label="Affected segment"
          value="iOS mobile · all markets · checkout step 3"
        />

        {/* Next action — no bottom border */}
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.textDim,
          }}>
            Next action
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: C.text, lineHeight: 1.55, letterSpacing: "-0.01em" }}>
            Enable Apple Pay and Google Pay on the Shopify checkout. Expected recovery after rollout: 60-80% of estimated exposure within 30 days.
          </div>
        </div>
      </div>

      {/* Attribution row */}
      <div style={{
        marginTop: 22, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logoSrc && (
            <img src={logoSrc} style={{
              width: 20, height: 20, objectFit: "contain",
              filter: "drop-shadow(0 0 6px rgba(200,154,16,0.5))",
            }} />
          )}
          <span style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.08em" }}>
            CHECKOUTLEAK
          </span>
        </div>
        <span style={{ fontFamily: F.mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em" }}>
          checkoutleak.com
        </span>
      </div>
    </AbsoluteFill>
  )
}
