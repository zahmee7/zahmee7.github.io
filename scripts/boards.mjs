// Snapshots of the live Power BI reports, shown on a project's file before the visitor opens the live
// report (DESIGN.md > Open file, the board). Run after the owner changes a report: npm run boards.
// Output: src/assets/boards/<id>.png (the report page at 1600 × 900, drawn at twice that), committed.
// Each report is the owner's own, published to web with sample data only; the script reads it as any
// visitor would, without signing in.
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const OUT = "src/assets/boards";
const VIEW = { width: 1600, height: 960 };

const projects = JSON.parse(await readFile("content/projects.json", "utf8"));
const boards = projects.filter(
  (project) => project.mvp && project.demo.status === "ready" && project.demo.kind === "powerbi",
);
if (!boards.length) {
  console.log("No ready Power BI demo: nothing to draw.");
  process.exit(0);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const project of boards) {
  const { url, page: pageName } = project.demo;
  const link = typeof url === "string" ? url : url.ar;
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 2 });
  await page.goto(pageName ? `${link}&pageName=${pageName}` : link);
  const canvas = page.locator(".displayArea").first();
  await canvas.waitFor({ state: "visible", timeout: 60_000 });
  // Visuals draw in after the canvas shows; give them time to finish and settle
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(6000);
  await canvas.screenshot({ path: `${OUT}/${project.id}.png` });
  console.log(`  ${OUT}/${project.id}.png`);
  await page.close();
}
await browser.close();
