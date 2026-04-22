import React from "react"
import { Composition } from "remotion"

import { CheckoutLeakVideo, VIDEO_DURATION_FRAMES, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./CheckoutLeakVideo"
import { CheckoutLeakMobile, MOBILE_DURATION_FRAMES, MOBILE_FPS, MOBILE_HEIGHT, MOBILE_WIDTH } from "./MobileVideo"
import { Social1TheNumber } from "./socials/Social1TheNumber"
import { Social2RankedPanel } from "./socials/Social2RankedPanel"
import { Social3ThreeSurfaces } from "./socials/Social3ThreeSurfaces"
import { Social4ActionBrief } from "./socials/Social4ActionBrief"
import { Social5Editorial } from "./socials/Social5Editorial"
import { Social6PersonalContrarian } from "./socials/Social6PersonalContrarian"
import { Social7PersonalMath } from "./socials/Social7PersonalMath"
import { Social8PersonalList } from "./socials/Social8PersonalList"
import { Social9BrandBenchmark } from "./socials/Social9BrandBenchmark"
import { Social10BrandWeekly } from "./socials/Social10BrandWeekly"
import { Social11BrandCoverage } from "./socials/Social11BrandCoverage"
import { Social12XHook } from "./socials/Social12XHook"
import { Social13XGap } from "./socials/Social13XGap"
import { Social14XProcess } from "./socials/Social14XProcess"
import { Social15XBeforeAfter } from "./socials/Social15XBeforeAfter"
import { Social16XPhilosophy } from "./socials/Social16XPhilosophy"

export function RemotionRoot() {
  return (
    <>
      {/* ── Video compositions ──────────────────────────────── */}

      {/* 16:9 — website hero, YouTube, X/Twitter */}
      <Composition
        id="CheckoutLeakVideo"
        component={CheckoutLeakVideo}
        durationInFrames={VIDEO_DURATION_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />

      {/* 9:16 — Instagram Reels, TikTok, Stories */}
      <Composition
        id="CheckoutLeakMobile"
        component={CheckoutLeakMobile}
        durationInFrames={MOBILE_DURATION_FRAMES}
        fps={MOBILE_FPS}
        width={MOBILE_WIDTH}
        height={MOBILE_HEIGHT}
      />

      {/* ── Social stills — 1080×1080 ───────────────────────── */}

      {/* 1. The Revenue Number — stop-scroll, big amber counter */}
      <Composition
        id="Social1TheNumber"
        component={Social1TheNumber}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 2. Ranked Panel — full product dashboard */}
      <Composition
        id="Social2RankedPanel"
        component={Social2RankedPanel}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 3. Three Surfaces — signal family overview */}
      <Composition
        id="Social3ThreeSurfaces"
        component={Social3ThreeSurfaces}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 4. Action Brief — single finding detail, credibility */}
      <Composition
        id="Social4ActionBrief"
        component={Social4ActionBrief}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 5. The Editorial — pure typography, opinion/awareness */}
      <Composition
        id="Social5Editorial"
        component={Social5Editorial}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* ── Personal X account stills ───────────────────────── */}

      {/* 6. The Contrarian — hot take, thought leadership */}
      <Composition
        id="Social6PersonalContrarian"
        component={Social6PersonalContrarian}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 7. The Math — revenue calculation, credibility */}
      <Composition
        id="Social7PersonalMath"
        component={Social7PersonalMath}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 8. The Audit List — 4 recurring patterns */}
      <Composition
        id="Social8PersonalList"
        component={Social8PersonalList}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* ── Brand stills ────────────────────────────────────── */}

      {/* 9. The Benchmark — average vs top-quartile comparison */}
      <Composition
        id="Social9BrandBenchmark"
        component={Social9BrandBenchmark}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 10. Weekly Intelligence — automated monitoring concept */}
      <Composition
        id="Social10BrandWeekly"
        component={Social10BrandWeekly}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* 11. The Coverage — every signal surface */}
      <Composition
        id="Social11BrandCoverage"
        component={Social11BrandCoverage}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* ── X personal — 1080×1080 ─────────────────────────── */}

      <Composition id="Social12XHook" component={Social12XHook} durationInFrames={1} fps={30} width={1080} height={1080} />
      <Composition id="Social13XGap" component={Social13XGap} durationInFrames={1} fps={30} width={1080} height={1080} />
      <Composition id="Social14XProcess" component={Social14XProcess} durationInFrames={1} fps={30} width={1080} height={1080} />
      <Composition id="Social15XBeforeAfter" component={Social15XBeforeAfter} durationInFrames={1} fps={30} width={1080} height={1080} />
      <Composition id="Social16XPhilosophy" component={Social16XPhilosophy} durationInFrames={1} fps={30} width={1080} height={1080} />

      {/* ── Instagram 4:5 stills — 1080×1350 ───────────────── */}

      <Composition
        id="Social1TheNumber-45"
        component={Social1TheNumber}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social2RankedPanel-45"
        component={Social2RankedPanel}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social3ThreeSurfaces-45"
        component={Social3ThreeSurfaces}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social4ActionBrief-45"
        component={Social4ActionBrief}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social5Editorial-45"
        component={Social5Editorial}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social6PersonalContrarian-45"
        component={Social6PersonalContrarian}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social7PersonalMath-45"
        component={Social7PersonalMath}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social8PersonalList-45"
        component={Social8PersonalList}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social9BrandBenchmark-45"
        component={Social9BrandBenchmark}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social10BrandWeekly-45"
        component={Social10BrandWeekly}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
      <Composition
        id="Social11BrandCoverage-45"
        component={Social11BrandCoverage}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1350}
      />
    </>
  )
}
