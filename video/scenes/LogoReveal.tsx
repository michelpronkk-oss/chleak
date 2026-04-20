import React from "react"
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion"
import { useTransparentLogo } from "../hooks/useTransparentLogo"
import { C, F } from "../components/tokens"

export const LOGO_DURATION = 105 // 3.5s

export function LogoReveal() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const logoSrc = useTransparentLogo("logo.png")

  const logoSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 160, stiffness: 90, mass: 0.9 },
    durationInFrames: 55,
  })
  const logoScale = 0.78 + 0.22 * logoSpring
  const logoOpacity = interpolate(frame, [8, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })

  const glowOpacity = interpolate(frame, [28, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const glowScale = 0.7 + 0.3 * interpolate(frame, [28, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  const wordmarkOpacity = interpolate(frame, [52, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const taglineOpacity = interpolate(frame, [66, 82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
  const sceneOpacity = interpolate(frame, [LOGO_DURATION - 12, LOGO_DURATION], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        {/* Amber glow halo — behind logo, no white box */}
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200,154,16,0.22) 0%, rgba(200,154,16,0.08) 40%, transparent 70%)",
            filter: "blur(52px)",
            opacity: glowOpacity,
            transform: `scale(${glowScale})`,
            pointerEvents: "none",
          }}
        />

        {/* Logo — transparent bg, floats directly on dark */}
        {logoSrc && (
          <img
            src={logoSrc}
            style={{
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              width: 220,
              height: 220,
              objectFit: "contain",
              position: "relative",
              zIndex: 1,
              filter: `drop-shadow(0 0 40px rgba(200,154,16,0.5)) drop-shadow(0 0 80px rgba(200,154,16,0.25))`,
            }}
          />
        )}

        {/* Wordmark */}
        <div
          style={{
            opacity: wordmarkOpacity,
            marginTop: 32,
            fontFamily: F.mono,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.text,
            position: "relative",
            zIndex: 2,
          }}
        >
          CHECKOUTLEAK
        </div>

        {/* Sub */}
        <div
          style={{
            opacity: taglineOpacity,
            marginTop: 10,
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.textDim,
            position: "relative",
            zIndex: 2,
          }}
        >
          Revenue Intelligence
        </div>
      </div>
    </AbsoluteFill>
  )
}
