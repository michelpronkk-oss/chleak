/**
 * Social 9 — Brand · "The Benchmark"
 * Industry comparison. Shows the gap between average and top-quartile stores.
 * Best for: Instagram feed, LinkedIn, X
 */
import React from "react"
import { AbsoluteFill } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { SocialDotLayer } from "../components/SocialDotLayer"
import { C, F } from "../components/tokens"

export function Social9BrandBenchmark() {
  const logoSrc = useTransparentLogo("logo.png")

  return (
    <AbsoluteFill style={{
      background: C.bg,
      fontFamily: F.sans,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "64px 72px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Corner vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, transparent 52%, rgba(0,0,0,0.20) 100%)",
        pointerEvents: "none",
      }} />
      <SocialDotLayer />

      {/* Eyebrow */}
      <div style={{
        fontFamily: F.mono, fontSize: 11, letterSpacing: "0.14em",
        textTransform: "uppercase", color: C.amber, marginBottom: 48,
        position: "relative", zIndex: 1,
      }}>
        Checkout completion benchmark
      </div>

      {/* Two-column comparison */}
      <div style={{
        display: "flex", gap: 20, width: "100%",
        position: "relative", zIndex: 1,
      }}>
        {/* Average */}
        <div style={{
          flex: 1,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "32px 32px 28px",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.textDim, marginBottom: 20,
          }}>
            Average store
          </div>
          <div style={{
            fontFamily: F.mono, fontSize: 96, fontWeight: 700,
            letterSpacing: "-0.05em", lineHeight: 1, color: C.textMuted,
          }}>
            68%
          </div>
          <div style={{
            marginTop: 20,
            fontFamily: F.sans, fontSize: 14, color: C.textDim,
            letterSpacing: "-0.01em", lineHeight: 1.5,
          }}>
            Checkout completion rate across the industry median.
          </div>
        </div>

        {/* Top quartile */}
        <div style={{
          flex: 1,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "32px 32px 28px",
          display: "flex", flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Amber top accent */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(to right, transparent, ${C.amber} 28%, ${C.amber} 72%, transparent)`,
          }} />
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.amber, marginBottom: 20,
            marginTop: 2,
          }}>
            Top quartile
          </div>
          <div style={{
            fontFamily: F.mono, fontSize: 96, fontWeight: 700,
            letterSpacing: "-0.05em", lineHeight: 1, color: C.amber,
          }}>
            84%
          </div>
          <div style={{
            marginTop: 20,
            fontFamily: F.sans, fontSize: 14, color: C.textMuted,
            letterSpacing: "-0.01em", lineHeight: 1.5,
          }}>
            Completion rate for stores with active revenue intelligence.
          </div>
        </div>
      </div>

      {/* Gap callout */}
      <div style={{
        marginTop: 24, width: "100%",
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", zIndex: 1,
      }}>
        <div>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: "0.1em",
            textTransform: "uppercase", color: C.textDim, marginBottom: 8,
          }}>
            The gap
          </div>
          <div style={{
            fontFamily: F.sans, fontSize: 18, color: C.text,
            letterSpacing: "-0.02em",
          }}>
            16pp improvement. On a $500k/mo store — that's{" "}
            <span style={{ color: C.amber, fontWeight: 600 }}>$80k/mo recovered.</span>
          </div>
        </div>
        <div style={{
          fontFamily: F.mono, fontSize: 48, fontWeight: 700,
          letterSpacing: "-0.04em", color: C.amber, flexShrink: 0, marginLeft: 32,
        }}>
          +16pp
        </div>
      </div>

      {/* Bottom attribution */}
      <div style={{
        marginTop: 24, width: "100%",
        display: "flex", alignItems: "center", gap: 12,
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
