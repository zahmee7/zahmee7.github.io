// Stops dev and build early when the licensed thmanyah files are missing.
// They are never committed (see CLAUDE.md > Fonts), so a fresh clone does not have them.
import { existsSync } from "node:fs";

const dir = "src/assets/fonts/thmanyah";
const files = [
  "thmanyahserifdisplay-Bold.woff2",
  "thmanyahsans-Regular.woff2",
  "thmanyahseriftext-Regular.woff2",
];

const missing = files.filter((name) => !existsSync(`${dir}/${name}`));

if (missing.length > 0) {
  console.error(
    [
      "",
      `Missing thmanyah font files in ${dir}/:`,
      ...missing.map((name) => `  ${name}`),
      "",
      "They are licensed to the owner and never committed.",
      "Locally: copy them from design/fonts/thmanyah/ (unchanged).",
      "In CI: the deploy workflow fetches them from the private fonts repository (docs/DEPLOY.md).",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
