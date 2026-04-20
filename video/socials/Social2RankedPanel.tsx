/**
 * Social 2 — "Ranked Intelligence"
 * Full product panel front and center. Shows exactly what operators get.
 * Best for: Instagram feed, LinkedIn, Facebook
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

const findings = [
  { rank: "01", label: "Shipping step drop-off variance", impact: "$24,100 / mo", sev: "high" as const, conf: "High confidence" },
  { rank: "02", label: "iOS wallet coverage gap", impact: "$18,700 / mo", sev: "high" as const, conf: "High confidence" },
  { rank: "03", label: "Retry cadence underperforming", impact: "$16,100 / mo", sev: "medium" as const, conf: "Medium confidence" },
  { rank: "04", label: "Cross-border decline elevation", impact: "$9,200 / mo", sev: "medium" as const, conf: "Medium confidence" },
]

export function Social2RankedPanel() {
  const logoSrc = useTransparentLogo("logo.png")

  return (
    <AbsoluteFill style={{
      background: C.bg,
      fontFamily: F.sans,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 52,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top bloom */}
      <div style={{
        position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
        width: 960, height: 460,
        background: "radial-gradient(50% 45% at 50% 0%, rgba(200,154,16,0.10), transparent 100%)",
        filter: "blur(72px)", pointerEvents: "none",
      }} />

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.20) 100%)",
        pointerEvents: "none",
      }} />
      <SocialDotLayer />

      {/* Headline */}
      <div style={{ textAlign: "center", marginBottom: 28, position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
          textTransform: "uppercase", color: C.amber, marginBottom: 14,
        }}>
          Revenue intelligence
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 46, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.08, color: C.text,
        }}>
          4 revenue findings.
        </div>
        <div style={{
          fontFamily: F.sans, fontSize: 46, fontWeight: 700,
          letterSpacing: "-0.04em", lineHeight: 1.08, color: C.amber,
        }}>
          Ranked by impact.
        </div>
      </div>

      {/* The vault panel */}
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

        {/* Panel header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", marginTop: 2, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber }} />
            <span style={{ fontFamily: F.sans, fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>
              Revenue intelligence
            </span>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.06em" }}>SCN-2847</span>
            <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.amber }}>live</span>
          </div>
        </div>

        {/* Metric row */}
        <div style={{
          padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
          background: "linear-gradient(180deg, rgba(200,154,16,0.055) 0%, transparent 60%)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textMuted, letterSpacing: "0.06em", marginBottom: 8 }}>
              Estimated monthly leakage
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 42, fontWeight: 700, color: C.amber, letterSpacing: "-0.04em", lineHeight: 1 }}>
              $68.1k
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.06em", marginBottom: 6 }}>
              4 findings · ranked by exposure
            </div>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.06em" }}>
              Shopify + Stripe · 2 min ago
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "8px 24px", borderBottom: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.012)",
        }}>
          <div style={{ width: 2, flexShrink: 0 }} />
          <div style={{ width: 28, fontFamily: F.mono, fontSize: 10, color: C.textDim, letterSpacing: "0.08em" }}>#</div>
          <div style={{ flex: 1, fontFamily: F.mono, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Finding</div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Impact / mo</div>
        </div>

        {/* Issue rows */}
        {findings.map((f, i) => (
          <div key={f.rank} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 24px",
            borderBottom: i < findings.length - 1 ? `1px solid ${C.border}` : undefined,
          }}>
            <div style={{
              width: 2, height: 22, borderRadius: 2, flexShrink: 0,
              background: f.sev === "high" ? C.amber : C.sevMedium,
            }} />
            <span style={{ fontFamily: F.mono, fontSize: 11, color: C.textDim, letterSpacing: "0.06em", flexShrink: 0, width: 28 }}>
              {f.rank}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.sans, fontSize: 14, color: C.text, letterSpacing: "-0.01em" }}>{f.label}</div>
              <div style={{ marginTop: 3, fontFamily: F.mono, fontSize: 10, color: C.textDim }}>{f.conf}</div>
            </div>
            <span style={{
              fontFamily: F.mono, fontSize: 13, letterSpacing: "0.02em",
              color: f.sev === "high" ? C.amber : C.textMuted, flexShrink: 0,
            }}>
              {f.impact}
            </span>
          </div>
        ))}

        {/* Total */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "13px 24px", background: "rgba(200,154,16,0.04)",
        }}>
          <span style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim }}>
            Total exposure
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 600, color: C.amber }}>
            $68,100 / mo
          </span>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{
        marginTop: 22, display: "flex", alignItems: "center", gap: 14,
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
