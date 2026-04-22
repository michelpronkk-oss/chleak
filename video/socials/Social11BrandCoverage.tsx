/**
 * Social 11 — Brand · "The Coverage"
 * Shows breadth: every signal surface in one system.
 * Best for: Instagram, LinkedIn, X
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

const surfaces = [
  {
    name: "Checkout",
    source: "Shopify",
    signals: ["Step-level drop-off by device", "Shipping method friction", "Address validation failures", "Coupon code abandonment"],
    findings: "2 findings",
    sev: "high" as const,
  },
  {
    name: "Payments",
    source: "Shopify · Stripe",
    signals: ["Wallet method coverage gaps", "Decline rate elevation", "Cross-border friction", "Currency mismatch"],
    findings: "1 finding",
    sev: "high" as const,
  },
  {
    name: "Billing",
    source: "Stripe · Dodo",
    signals: ["Retry cadence performance", "Failed renewal patterns", "Dunning sequence gaps", "Recovery rate benchmarks"],
    findings: "1 finding",
    sev: "medium" as const,
  },
]

export function Social11BrandCoverage() {
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

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.22) 100%)",
        pointerEvents: "none",
      }} />
      <SocialDotLayer />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.amber, marginBottom: 14,
        }}>
          Signal coverage
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 44, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.08, color: C.text,
        }}>
          One system.
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 44, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.08, color: C.amber,
        }}>
          Every surface.
        </div>
      </div>

      {/* Surface cards */}
      <div style={{
        display: "flex", gap: 14, width: "100%",
        position: "relative", zIndex: 1,
      }}>
        {surfaces.map((s) => (
          <div key={s.name} style={{
            flex: 1,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Amber accent for high sev */}
            {s.sev === "high" && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(to right, transparent, ${C.amber} 28%, ${C.amber} 72%, transparent)`,
              }} />
            )}

            {/* Card header */}
            <div style={{
              padding: "20px 20px 16px", marginTop: s.sev === "high" ? 2 : 0,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{
                fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
                textTransform: "uppercase", color: C.textDim, marginBottom: 8,
              }}>
                {s.source}
              </div>
              <div style={{
                fontFamily: F.sans, fontSize: 26, fontWeight: 700,
                letterSpacing: "-0.03em", color: C.text,
              }}>
                {s.name}
              </div>
            </div>

            {/* Signal list */}
            <div style={{ padding: "16px 20px", flex: 1 }}>
              {s.signals.map((sig, i) => (
                <div key={sig} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  paddingBottom: i < s.signals.length - 1 ? 10 : 0,
                }}>
                  <div style={{
                    width: 3, height: 3, borderRadius: "50%", flexShrink: 0,
                    background: C.textDim,
                  }} />
                  <span style={{
                    fontFamily: F.sans, fontSize: 11, color: C.textMuted,
                    letterSpacing: "-0.005em", lineHeight: 1.4,
                  }}>
                    {sig}
                  </span>
                </div>
              ))}
            </div>

            {/* Card footer */}
            <div style={{
              padding: "11px 20px",
              borderTop: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontFamily: F.mono, fontSize: 10, color: s.sev === "high" ? C.amber : C.textDim,
                letterSpacing: "0.06em",
              }}>
                {s.findings}
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
