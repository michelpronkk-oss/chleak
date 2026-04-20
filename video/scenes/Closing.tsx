import React from "react"
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { C, F } from "../components/tokens"

export const CLOSING_DURATION = 120 // 4s

export function Closing() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const logoSrc = useTransparentLogo("logo.png")

  const logoSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 180, stiffness: 100, mass: 0.7 },
    durationInFrames: 45,
  })
  const logoScale = 0.82 + 0.18 * logoSpring
  const logoOpacity = interpolate(frame, [6, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })

  const glowOpacity = interpolate(frame, [18, 48], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  const wordmarkOpacity = interpolate(frame, [36, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const taglineOpacity = interpolate(frame, [52, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const dividerOpacity = interpolate(frame, [64, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const urlOpacity = interpolate(frame, [74, 88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const sceneOpacity = interpolate(frame, [CLOSING_DURATION - 16, CLOSING_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  })

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          opacity: sceneOpacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Glow halo */}
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200,154,16,0.18) 0%, rgba(200,154,16,0.06) 40%, transparent 70%)",
            filter: "blur(44px)",
            opacity: glowOpacity,
            pointerEvents: "none",
          }}
        />

        {/* Logo — transparent, drop-shadow glow */}
        {logoSrc && (
          <img
            src={logoSrc}
            style={{
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              width: 140,
              height: 140,
              objectFit: "contain",
              position: "relative",
              zIndex: 1,
              filter: `drop-shadow(0 0 28px rgba(200,154,16,0.48)) drop-shadow(0 0 60px rgba(200,154,16,0.22))`,
            }}
          />
        )}

        {/* Wordmark */}
        <div
          style={{
            opacity: wordmarkOpacity,
            marginTop: 24,
            fontFamily: F.mono,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.text,
            zIndex: 2,
          }}
        >
          CHECKOUTLEAK
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            marginTop: 14,
            fontFamily: F.sans,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: C.text,
            zIndex: 2,
          }}
        >
          Revenue leaks, ranked by recovery.
        </div>

        {/* Divider */}
        <div
          style={{
            opacity: dividerOpacity,
            marginTop: 22,
            width: 36,
            height: 1,
            background: `linear-gradient(to right, transparent, ${C.border}, transparent)`,
            zIndex: 2,
          }}
        />

        {/* URL */}
        <div
          style={{
            opacity: urlOpacity,
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 2,
          }}
        >
          <span style={{ fontFamily: F.mono, fontSize: 13, color: C.amber, letterSpacing: "0.08em" }}>
            checkoutleak.com
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.textDim,
            }}
          >
            Invite only · Reviewed manually
          </span>
        </div>
      </div>
    </AbsoluteFill>
  )
}
