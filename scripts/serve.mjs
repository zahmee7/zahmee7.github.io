// Serves dist/ the way GitHub Pages does, for the Playwright tests (playwright.config.ts):
// folder URLs get their index.html, a folder without its trailing slash is redirected, unknown paths get
// 404.html with a 404 status, and every file is sent with Cache-Control: max-age=600 and no Vary: Origin.
// `astro preview` sends no-cache and Vary: Origin, which makes WebKit fetch preloaded fonts twice and warn
// that the preload went unused. The real site does not do that, so the tests should not either.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = "dist";
const PORT = Number(process.argv[2] ?? 4330);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".vtt": "text/vtt; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

async function isFile(path) {
  return (await stat(path).catch(() => null))?.isFile() ?? false;
}

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  const path = normalize(join(ROOT, decodeURIComponent(pathname)));
  const send = async (file, status = 200) => {
    response.writeHead(status, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "max-age=600",
    });
    response.end(request.method === "HEAD" ? undefined : await readFile(file));
  };

  if (!path.startsWith(normalize(ROOT))) return send(join(ROOT, "404.html"), 404);
  if (pathname.endsWith("/") && (await isFile(join(path, "index.html"))))
    return send(join(path, "index.html"));
  if (await isFile(path)) return send(path);
  if (await isFile(join(path, "index.html"))) {
    response.writeHead(301, { Location: `${pathname}/` });
    return response.end();
  }
  return send(join(ROOT, "404.html"), 404);
}).listen(PORT, "127.0.0.1", () => console.log(`dist on http://127.0.0.1:${PORT}/`));
