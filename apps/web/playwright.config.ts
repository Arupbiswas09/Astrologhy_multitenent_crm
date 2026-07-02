import { defineConfig } from "@playwright/test";

/**
 * E2E against the production build + local seeded Directus (docs/09 Phase 5).
 * Run: pnpm cms:up && pnpm cms:seed && pnpm --filter @astro-note/web test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3996",
    // 390×844 mobile-first (docs/07 §7) on Chromium (the only browser in CI)
    browserName: "chromium",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  webServer: {
    command: "pnpm build && pnpm start --port 3996",
    url: "http://localhost:3996",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
