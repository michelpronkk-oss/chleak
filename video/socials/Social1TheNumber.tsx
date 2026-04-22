/**
 * Social 1 — "The Number"
 * Stop-scroll: the dollar amount, full screen, no explanation needed.
 * Best for: Instagram feed, Facebook, X
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

const findings = [
  { label: "Shipping step drop-off variance", impact: "$24,100", sev: "high" as const },
  { label: "iOS wallet coverage gap", impact: "$18,700", sev: "high" as const },
  { label: "Retry cadence underperforming", impact: "$16,100", sev: "medium" as const },
  { label: "Cross-border decline elevation", impact: "$9,200", sev: "medium" as const },
]

export function Social1TheNumber() {
  const logoSrc = useTransparentLogo("logo.png")

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        fontFamily: F.sans,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 64,
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.22) 100%)",
        pointerEvents: "none",
      }} />
      <SocialDotLayer />

      {/* Wordmark row */}
      <div style={{
        position: "absolute", top: 52, left: 60, right: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {logoSrc && (
            <img src={logoSrc} style={{
              width: 28, height: 28, objectFit: "contain",
              filter: "drop-shadow(0 0 8px rgba(200,154,16,0.45))",
            }} />
          )}
          <span style={{
            fontFamily: F.mono, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.18em", textTransform: "uppercase", color: C.text,
          }}>
            CHECKOUTLEAK
          </span>
        </div>
        <span style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
          textTransform: "uppercase", color: C.textDim,
        }}>
          Revenue Intelligence
        </span>
      </div>

      {/* Center content */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1, width: "100%" }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.amber, marginBottom: 20,
        }}>
          Estimated monthly leakage
        </div>

        {/* The number */}
        <div style={{
          fontFamily: F.mono, fontSize: 160, fontWeight: 700,
          letterSpacing: "-0.055em", lineHeight: 1, color: C.amber,
        }}>
          $68.1k
        </div>

        {/* Sub */}
        <div style={{
          marginTop: 20, fontFamily: F.sans, fontSize: 17,
          letterSpacing: "-0.01em", color: C.textMuted, lineHeight: 1.55,
        }}>
          Revenue leaking silently across<br />checkout and billing paths.
        </div>

        {/* Thin amber line */}
        <div style={{
          width: 40, height: 1, margin: "24px auto",
          background: `linear-gradient(to right, transparent, ${C.amber}, transparent)`,
        }} />

        {/* Mini findings list */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 0,
          width: "100%", maxWidth: 640, margin: "0 auto",
        }}>
          {findings.map((f, i) => (
            <div key={f.label} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "11px 24px",
              borderBottom: i < findings.length - 1 ? `1px solid ${C.borderSubtle}` : undefined,
            }}>
              <div style={{
                width: 2, height: 16, borderRadius: 2, flexShrink: 0,
                background: f.sev === "high" ? C.amber : C.sevMedium,
              }} />
              <span style={{
                flex: 1, fontFamily: F.sans, fontSize: 12, color: C.textMuted,
                textAlign: "left", letterSpacing: "-0.01em",
              }}>
                {f.label}
              </span>
              <span style={{
                fontFamily: F.mono, fontSize: 12,
                color: f.sev === "high" ? C.amber : C.textDim,
                letterSpacing: "0.03em",
              }}>
                {f.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom URL */}
      <div style={{
        position: "absolute", bottom: 48, zIndex: 2,
        fontFamily: F.mono, fontSize: 11, letterSpacing: "0.1em",
        textTransform: "uppercase", color: C.textDim,
      }}>
        checkoutleak.com · invite only
      </div>
    </AbsoluteFill>
  )
}
