import { useEffect, useState } from "react"
import { continueRender, delayRender, staticFile } from "remotion"

/**
 * Loads a logo PNG and removes near-white pixels via canvas pixel manipulation.
 * Returns a data URL with transparent background, or null while loading.
 */
export function useTransparentLogo(filename: string): string | null {
  const [src, setSrc] = useState<string | null>(null)
  const [handle] = useState(() => delayRender("Removing logo background"))

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i]
        const g = d[i + 1]
        const b = d[i + 2]
        // "Whiteness" = how close the darkest channel is to 255
        const whiteness = Math.min(r, g, b) / 255
        // Smoothly fade out near-white and pure-white pixels
        if (whiteness > 0.82) {
          d[i + 3] = Math.round(d[i + 3] * (1 - (whiteness - 0.82) / 0.18))
        }
      }

      ctx.putImageData(imageData, 0, 0)
      setSrc(canvas.toDataURL("image/png"))
      continueRender(handle)
    }

    img.onerror = () => {
      // Fallback: use original if canvas fails
      setSrc(staticFile(filename))
      continueRender(handle)
    }

    img.src = staticFile(filename)
  }, [filename, handle])

  return src
}
