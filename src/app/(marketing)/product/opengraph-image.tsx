import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "CheckoutLeak Product — Revenue Intelligence for Checkout and Billing"
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

        {/* Brand label */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#d4943a", flexShrink: 0 }} />
          <span style={{ color: "#94a3b8", fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>
            CheckoutLeak
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", paddingBottom: "8px" }}>
          <div style={{ color: "#d4943a", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: "20px" }}>
            Product
          </div>
          <div style={{ color: "#f1f5f9", fontSize: "56px", fontWeight: 600, lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: "780px" }}>
            Revenue intelligence for checkout and billing operators.
          </div>
          <div style={{ color: "#64748b", fontSize: "19px", lineHeight: 1.6, marginTop: "24px", maxWidth: "580px" }}>
            Connects to Shopify and Stripe. Detects leakage across checkout steps, payment methods, and billing recovery. Ranked by monthly impact.
          </div>
        </div>

        {/* Detection categories strip */}
        <div
          style={{
            position: "absolute",
            bottom: "44px",
            left: "80px",
            display: "flex",
            gap: "20px",
          }}
        >
          {["Checkout friction", "Payment gaps", "Billing recovery", "Setup gaps"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "6px",
                padding: "6px 14px",
                color: "#475569",
                fontSize: "11px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{ position: "absolute", bottom: "44px", right: "80px", color: "#334155", fontSize: "13px", letterSpacing: "0.07em" }}>
          checkoutleak.com
        </div>
      </div>
    ),
    { ...size }
  )
}
