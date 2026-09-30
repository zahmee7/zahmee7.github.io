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
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "pixel", use: { ...devices["Pixel 7"] } },
    { name: "iphone", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4321",
    url: "http://localhost:4321/ar/",
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
