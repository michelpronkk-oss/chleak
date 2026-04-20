import React from "react"
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { C, F } from "../components/tokens"
import { ease } from "../components/ui"

export const PRODUCT_DURATION = 330 // 11s

const PANEL_W = 1360

const issues = [
  { rank: "01", label: "Shipping step drop-off variance", impact: "$24,100 / mo", sev: "high" as const },
  { rank: "02", label: "iOS wallet coverage gap", impact: "$18,700 / mo", sev: "high" as const },
  { rank: "03", label: "Retry cadence underperforming", impact: "$16,100 / mo", sev: "medium" as const },
  { rank: "04", label: "Cross-border decline elevation", impact: "$9,200 / mo", sev: "medium" as const },
]

function liveCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`
  }
  return `$${n}`
}

export function ProductReveal() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const sceneOpacity = Math.min(
    ease(frame, 0, 14),
    ease(frame, PRODUCT_DURATION - 14, PRODUCT_DURATION, 1, 0),
  )

  // ─── BEAT 1: Big standalone counter (frames 0–110) ───────────────────────

  // Eyebrow above counter
  const eyebrowOp = ease(frame, 10, 26)

  // Counter rockets up, snaps to target
  const bigCountProg = interpolate(frame, [14, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  })
  const bigCountOp = ease(frame, 14, 30)
  const bigCountValue = Math.round(bigCountProg * 68100)

  // Sub label fades in once counter lands
  const subLabelOp = ease(frame, 88, 105)

  // Beat 1 fades out as beat 2 comes in
  const beat1Opacity = interpolate(frame, [100, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  })

  // ─── BEAT 2: Full-width panel reveal (frames 110–310) ─────────────────────

  const panelSpring = spring({
    frame: frame - 114,
    fps,
    config: { damping: 220, stiffness: 75, mass: 0.8 },
    durationInFrames: 75,
  })
  const panelY = (1 - panelSpring) * 90
  const panelOp = ease(frame, 114, 134)

  // Pulsing dot
  const dotPulse = 0.35 + 0.65 * Math.abs(Math.sin((frame / 30) * Math.PI))

  // Panel metric (smaller version of counter, fades in after panel arrives)
  const panelMetricOp = ease(frame, 142, 158)
  const panelCountProg = interpolate(frame, [142, 192], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.exp),
  })
  const panelCountValue = Math.round(panelCountProg * 68100)

  // Row stagger — tight cadence, feels like system populating
  const row0Op = ease(frame, 172, 188)
  const row0Y = ease(frame, 172, 188, 8, 0)
  const row1Op = ease(frame, 186, 202)
  const row1Y = ease(frame, 186, 202, 8, 0)
  const row2Op = ease(frame, 200, 216)
  const row2Y = ease(frame, 200, 216, 8, 0)
  const row3Op = ease(frame, 214, 230)
  const row3Y = ease(frame, 214, 230, 8, 0)

  const totalOp = ease(frame, 238, 252)
  const tagOp = ease(frame, 254, 268)

  const rowOps = [row0Op, row1Op, row2Op, row3Op]
  const rowYs = [row0Y, row1Y, row2Y, row3Y]

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Ambient bloom — always present */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1600,
          height: 600,
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(200,154,16,0.07), transparent 100%)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", height: "100%", opacity: sceneOpacity }}>

        {/* ── BEAT 1: Full-screen counter ─────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            opacity: beat1Opacity,
          }}
        >
          <div
            style={{
              opacity: eyebrowOp,
              fontFamily: F.mono,
              fontSize: 14,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.textDim,
              marginBottom: 28,
            }}
          >
            Estimated monthly leakage
          </div>

          {/* The number — large, amber, stark */}
          <div
            style={{
              opacity: bigCountOp,
              fontFamily: F.mono,
              fontSize: 180,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: C.amber,
              fontVariantNumeric: "tabular-nums",
            } as React.CSSProperties}
          >
            {liveCount(bigCountValue)}
          </div>

          <div
            style={{
              opacity: subLabelOp,
              marginTop: 24,
              fontFamily: F.sans,
              fontSize: 22,
              letterSpacing: "-0.01em",
              color: C.textMuted,
            }}
          >
            Detected across your checkout and billing paths.
          </div>
        </div>

        {/* ── BEAT 2: Panel ───────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            opacity: panelOp,
            transform: `translateY(${panelY}px)`,
          }}
        >
          {/* Wide vault panel */}
          <div
            style={{
              width: PANEL_W,
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Amber top accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(to right, ${C.card} 0%, ${C.amber} 38%, #c89a10 50%, ${C.amber} 62%, ${C.card} 100%)`,
              }}
            />

            {/* Panel header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 28px",
                marginTop: 2,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: C.amber,
                    opacity: dotPulse,
                  }}
                />
                <span
                  style={{
                    fontFamily: F.sans,
                    fontSize: 16,
                    fontWeight: 600,
                    color: C.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Revenue intelligence
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 12,
                    color: C.textDim,
                    letterSpacing: "0.06em",
                  }}
                >
                  SCN-2847
                </span>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: C.textDim,
                  }}
                >
                  live
                </span>
              </div>
            </div>

            {/* Metric */}
            <div
              style={{
                padding: "22px 28px",
                borderBottom: `1px solid ${C.border}`,
                background: "linear-gradient(180deg, rgba(200,154,16,0.065) 0%, transparent 55%)",
                opacity: panelMetricOp,
              }}
            >
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 12,
                  color: C.textMuted,
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                Estimated monthly leakage
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 54,
                  fontWeight: 700,
                  color: C.amber,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {liveCount(panelCountValue)}
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,154,16,0.42)" }}>
                  4 findings
                </span>
                <span style={{ width: 14, height: 1, background: C.border }} />
                <span style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,154,16,0.42)" }}>
                  ranked by exposure
                </span>
              </div>
            </div>

            {/* Rows */}
            {issues.map((issue, i) => (
              <div
                key={issue.rank}
                style={{
                  opacity: rowOps[i],
                  transform: `translateY(${rowYs[i]}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "16px 28px",
                  borderBottom: i < issues.length - 1 ? `1px solid ${C.border}` : undefined,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 26,
                    borderRadius: 2,
                    background: issue.sev === "high" ? C.amber : C.sevMedium,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 12,
                    color: C.textDim,
                    letterSpacing: "0.06em",
                    flexShrink: 0,
                    width: 28,
                  }}
                >
                  {issue.rank}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontFamily: F.sans,
                    fontSize: 16,
                    color: C.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {issue.label}
                </span>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 14,
                    color: C.amber,
                    flexShrink: 0,
                    letterSpacing: "0.02em",
                  }}
                >
                  {issue.impact}
                </span>
              </div>
            ))}

            {/* Total */}
            <div
              style={{
                opacity: totalOp,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px 28px",
                background: "rgba(200,154,16,0.042)",
              }}
            >
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.textDim,
                }}
              >
                Total exposure
              </span>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 15,
                  fontWeight: 600,
                  color: C.amber,
                  letterSpacing: "0.02em",
                }}
              >
                $68,100 / mo
              </span>
            </div>
          </div>

          {/* Source tag below panel */}
          <div
            style={{
              opacity: tagOp,
              marginTop: 24,
              fontFamily: F.mono,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.textDim,
            }}
          >
            Checkout · Payments · Billing
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
