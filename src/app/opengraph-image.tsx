import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "SilentLeak - Revenue Leak Monitoring"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090d",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Amber top hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(to right, transparent 0%, #d4943a 35%, #d4943a 65%, transparent 100%)",
          }}
        />

        {/* Top: brand label + kicker */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#d4943a",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: "#94a3b8",
              fontSize: "13px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            SilentLeak
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", paddingBottom: "8px" }}>
          <div
            style={{
              color: "#d4943a",
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 500,
              marginBottom: "20px",
            }}
          >
            Revenue leak monitoring
          </div>
          <div
            style={{
              color: "#f1f5f9",
              fontSize: "62px",
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              maxWidth: "820px",
            }}
          >
            Find what silently{" "}
            <span style={{ color: "#d4943a" }}>kills revenue.</span>
          </div>
          <div
            style={{
              color: "#64748b",
              fontSize: "20px",
              lineHeight: 1.6,
              marginTop: "24px",
              maxWidth: "620px",
            }}
          >
            Monitoring for websites, SaaS funnels, checkout paths, and billing flows.
          </div>
        </div>

        {/* Bottom brand */}
        <div
          style={{
            position: "absolute",
            bottom: "44px",
            right: "80px",
            color: "#334155",
            fontSize: "13px",
            letterSpacing: "0.07em",
            textTransform: "lowercase",
          }}
        >
          SilentLeak
        </div>

        {/* Subtle right-side depth element */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "320px",
            background: "linear-gradient(to left, rgba(212,148,58,0.03), transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  )
}

