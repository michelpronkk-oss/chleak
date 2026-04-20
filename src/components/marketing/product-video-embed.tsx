"use client"

import { useRef, useState } from "react"

export function ProductVideoEmbed() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded] = useState(false)

  function handlePlay() {
    const v = videoRef.current
    if (!v) return
    if (playing) {
      v.pause()
      setPlaying(false)
    } else {
      v.play()
      setPlaying(true)
    }
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        aspectRatio: "16/9",
        background: "#080b12",
        border: "1px solid #1a2438",
        boxShadow: "0 0 80px rgba(200,154,16,0.06), 0 32px 80px rgba(0,0,0,0.5)",
      }}
    >
      {/* Amber top accent */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-px rounded-t-xl"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(200,154,16,0.35), transparent)",
        }}
      />

      {/* Video element */}
      <video
        ref={videoRef}
        src="/video/checkoutleak.mp4"
        className="h-full w-full object-cover"
        playsInline
        preload="metadata"
        onCanPlay={() => setLoaded(true)}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Overlay — shown when not playing */}
      {!playing && (
        <button
          onClick={handlePlay}
          aria-label="Play video"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5"
          style={{ background: "rgba(8,11,18,0.55)", backdropFilter: "blur(2px)" }}
        >
          {/* Play button ring */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105"
            style={{
              borderColor: "rgba(200,154,16,0.5)",
              background: "rgba(200,154,16,0.08)",
              boxShadow: "0 0 40px rgba(200,154,16,0.18)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 translate-x-0.5"
              style={{ color: "#c89a10" }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Label */}
          <div className="text-center">
            <p
              className="font-mono text-[0.68rem] tracking-[0.12em] uppercase"
              style={{ color: "rgba(200,154,16,0.7)" }}
            >
              Product overview
            </p>
            <p
              className="mt-1 font-mono text-[0.58rem] tracking-[0.08em] uppercase"
              style={{ color: "rgba(200,154,16,0.3)" }}
            >
              18 seconds
            </p>
          </div>
        </button>
      )}

      {/* Not yet rendered notice — remove once video is in public/video/ */}
      {!loaded && !playing && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3"
          style={{ background: "#080b12" }}
        >
          <div
            className="font-mono text-[0.6rem] tracking-[0.1em] uppercase"
            style={{ color: "#2e3d58" }}
          >
            Run <span style={{ color: "#c89a10" }}>npm run video:render</span> to generate
          </div>
          <div
            className="font-mono text-[0.55rem] tracking-[0.06em]"
            style={{ color: "#1e2a40" }}
          >
            then place output at /public/video/checkoutleak.mp4
          </div>
        </div>
      )}
    </div>
  )
}
