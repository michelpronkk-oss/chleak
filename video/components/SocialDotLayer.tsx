import React from "react"

export function SocialDotLayer() {
  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
      opacity: 0.05,
    }} />
  )
}
