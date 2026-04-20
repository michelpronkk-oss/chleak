import React from "react"
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion"
import { C, F } from "./tokens"

// Core easing curve — matches the product's CSS cubic-bezier
export function ease(
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
): number {
  return interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 0.61, 0.36, 1),
  })
}

export function easeOut(
  frame: number,
  start: number,
  end: number,
  from = 0,
  to = 1,
): number {
  return interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })
}

// Full-screen dark wrapper with content fade-in and fade-out
export function SceneShell({
  children,
  durationInFrames,
  fadeDuration = 16,
}: {
  children: React.ReactNode
  durationInFrames: number
  fadeDuration?: number
}) {
  const frame = useCurrentFrame()
  const fadeIn = ease(frame, 0, fadeDuration)
  const fadeOut = ease(frame, durationInFrames - fadeDuration, durationInFrames, 1, 0)
  const opacity = Math.min(fadeIn, fadeOut)

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ width: "100%", height: "100%", opacity }}>{children}</div>
    </AbsoluteFill>
  )
}

// Centered layout helper
export function Center({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Monospace eyebrow label
export function Eyebrow({
  children,
  color = C.amber,
  style,
}: {
  children: React.ReactNode
  color?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        fontFamily: F.mono,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Vault panel — dark card with border and optional amber top accent
export function VaultPanel({
  children,
  width,
  amberAccent = false,
  style,
}: {
  children: React.ReactNode
  width?: number
  amberAccent?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        width: width ?? "auto",
        position: "relative",
        ...style,
      }}
    >
      {amberAccent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(to right, ${C.card} 0%, ${C.amber} 40%, #c89a10 50%, ${C.amber} 60%, ${C.card} 100%)`,
          }}
        />
      )}
      {children}
    </div>
  )
}

// Ranked issue row
export function IssueRow({
  label,
  impact,
  severity,
  opacity = 1,
}: {
  label: string
  impact: string
  severity: "high" | "medium"
  opacity?: number
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 18px",
        opacity,
      }}
    >
      <div
        style={{
          width: 3,
          height: 20,
          borderRadius: 2,
          background: severity === "high" ? C.sevHigh : C.sevMedium,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, fontFamily: F.sans, fontSize: 13, color: C.text, lineHeight: 1.4 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 11,
          color: C.amber,
          flexShrink: 0,
          letterSpacing: "0.04em",
        }}
      >
        {impact}
      </div>
    </div>
  )
}

// Ambient amber bloom at top
export function AmberBloom({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 1000,
        height: 420,
        background:
          "radial-gradient(60% 50% at 50% 0%, rgba(200,154,16,0.07), transparent 100%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        opacity,
      }}
    />
  )
}
