import React from "react"
import { Series } from "remotion"

import { Closing, CLOSING_DURATION } from "./scenes/Closing"
import { LogoReveal, LOGO_DURATION } from "./scenes/LogoReveal"
import { ProductRevealMobile, PRODUCT_MOBILE_DURATION } from "./scenes/ProductRevealMobile"

export const MOBILE_FPS = 30
export const MOBILE_WIDTH = 1080
export const MOBILE_HEIGHT = 1920
export const MOBILE_DURATION_FRAMES = LOGO_DURATION + PRODUCT_MOBILE_DURATION + CLOSING_DURATION

export function CheckoutLeakMobile() {
  return (
    <Series>
      <Series.Sequence durationInFrames={LOGO_DURATION}>
        <LogoReveal />
      </Series.Sequence>

      <Series.Sequence durationInFrames={PRODUCT_MOBILE_DURATION}>
        <ProductRevealMobile />
      </Series.Sequence>

      <Series.Sequence durationInFrames={CLOSING_DURATION}>
        <Closing />
      </Series.Sequence>
    </Series>
  )
}
