import { defineConfig, devices } from "@playwright/test";

// Read CI without pulling in @types/node for one variable.
const CI = Boolean(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.CI,
);

// Three devices from CLAUDE.md > Tests. Every spec runs its checks in both ar and en.
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4330",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "pixel", use: { ...devices["Pixel 7"] } },
    { name: "iphone", use: { ...devices["iPhone 15"] } },
  ],
  // A GitHub Pages–like server on its own port (scripts/serve.mjs), apart from the owner's `npm run preview`
  webServer: {
    command: "npm run build && node scripts/serve.mjs 4330",
    url: "http://127.0.0.1:4330/ar/",
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
