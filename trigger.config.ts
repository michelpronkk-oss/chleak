import { defineConfig } from "@trigger.dev/sdk/v3"
import { playwright } from "@trigger.dev/build/extensions/playwright"

export default defineConfig({
  project: "proj_cxghokhenspxdbmgrczh",
  runtime: "node",
  logLevel: "log",
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 2,
      minTimeoutInMs: 2000,
      maxTimeoutInMs: 30000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["./src/trigger"],
  build: {
    // Mark browser automation packages as external so esbuild does not try
    // to bundle their internals. They contain optional deps (chromium-bidi,
    // native binaries) that are not installed and will error at bundle time.
    // These packages are available as runtime dependencies in the worker.
    external: [
      "playwright-core",
      "playwright",
      "chromium-bidi",
      "@sparticuz/chromium",
    ],
    extensions: [
      playwright({ browsers: ["chromium"] }),
    ],
  },
})
