import Image from "next/image"

import { formatRelativeTimestamp } from "@/lib/format"

export interface EvidenceScreenshot {
  label: string
  src: string | null
  viewport: string
  capturedUrl: string | null
  capturedAt: string | null
  sha256?: string | null
  bytes?: number | null
}

function isRenderableScreenshot(src: string | null) {
  return Boolean(src && src.startsWith("/evidence/"))
}

export function EvidenceScreenshots({
  screenshots,
  title = "Screenshot evidence",
}: {
  screenshots: EvidenceScreenshot[]
  title?: string
}) {
  const visible = screenshots.filter((shot) => shot.src || shot.capturedUrl)

  return (
    <div className="rounded-xl border border-border/70 bg-background/35 p-4">
      <p className="data-mono text-muted-foreground">{title}</p>
      {visible.length ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {visible.map((shot) => {
            const canRender = isRenderableScreenshot(shot.src)
            return (
              <figure
                key={`${shot.label}:${shot.src ?? shot.viewport}`}
                className="overflow-hidden rounded-lg border border-border/60 bg-background/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
                  <figcaption className="text-sm font-medium text-foreground">
                    {shot.label}
                  </figcaption>
                  <span className="font-mono text-[0.65rem] uppercase text-muted-foreground">
                    {shot.viewport}
                  </span>
                </div>
                {canRender && shot.src ? (
                  <div className="relative aspect-[16/10] bg-background/40">
                    <Image
                      src={shot.src}
                      alt={`${shot.label} screenshot evidence`}
                      fill
                      sizes="(min-width: 1024px) 42vw, 92vw"
                      className="object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-background/40 px-4 text-center text-sm text-muted-foreground">
                    Screenshot reference is stored, but no browser-renderable image is available in this environment.
                  </div>
                )}
                <dl className="space-y-1 px-3 py-3 text-xs text-muted-foreground">
                  <div>
                    <dt className="sr-only">Captured URL</dt>
                    <dd className="break-all">{shot.capturedUrl ?? "Captured URL unavailable"}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <dd>
                      {shot.capturedAt ? formatRelativeTimestamp(shot.capturedAt) : "Capture time unavailable"}
                    </dd>
                    {shot.bytes ? <dd>{shot.bytes.toLocaleString()} bytes</dd> : null}
                  </div>
                  {shot.sha256 ? (
                    <div>
                      <dt className="sr-only">SHA-256</dt>
                      <dd className="truncate font-mono text-muted-foreground/65">
                        sha256 {shot.sha256}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </figure>
            )
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Screenshot evidence is not available for this run yet.
        </p>
      )}
    </div>
  )
}
