import React from "react"
import { Series } from "remotion"

import { Closing, CLOSING_DURATION } from "./scenes/Closing"
import { LogoReveal, LOGO_DURATION } from "./scenes/LogoReveal"
import { ProductReveal, PRODUCT_DURATION } from "./scenes/ProductReveal"

export const VIDEO_FPS = 30
export const VIDEO_WIDTH = 1920
export const VIDEO_HEIGHT = 1080
export const VIDEO_DURATION_FRAMES = LOGO_DURATION + PRODUCT_DURATION + CLOSING_DURATION // 555f = 18.5s

export function CheckoutLeakVideo() {
  return (
    <Series>
      <Series.Sequence durationInFrames={LOGO_DURATION}>
        <LogoReveal />
      </Series.Sequence>

      <Series.Sequence durationInFrames={PRODUCT_DURATION}>
        <ProductReveal />
      </Series.Sequence>

      <Series.Sequence durationInFrames={CLOSING_DURATION}>
        <Closing />
      </Series.Sequence>
    </Series>
  )
}
