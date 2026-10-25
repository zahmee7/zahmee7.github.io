import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

// content/projects.json is the only source of project copy (CLAUDE.md > Content model).
// A wrong or missing field stops the build with a clear message.

const status = z.enum(["planned", "later", "ready"]);

// One scene of a film: its on-screen text in both languages. The same lines are the captions
// (src/pages/films/[id]/captions.[lang].vtt.ts) and the text under the film. " · " splits a scene's lines.
const scene = z.object({
  start: z.number().min(0),
  end: z.number().positive(),
  en: z.string().min(1),
  ar: z.string().min(1),
});

const copy = z.object({
  short: z.string().min(1),
  /** The small line over the title. Optional: the owner left it off the dashboard (2026-10-25). */
  tag: z.string().min(1).optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  context: z.string().min(1),
  did: z.string().min(1),
  result: z.string().min(1),
  demoLabel: z.string().min(1),
  downloadLabel: z.string().min(1),
});

const projects = defineCollection({
  loader: file("content/projects.json"),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    order: z.number().int().min(1).max(6),
    mvp: z.boolean(),
    /** A locked folder whose name is blacked out on its tab, like a classified file (owner, 2026-10-25). */
    redacted: z.boolean().optional(),
    tone: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    // The demo is the project's own file in a sample version (owner's decision, Phase 6): a published
    // Power BI report, an Excel workbook (OneDrive embed, or a file on this site shown in Microsoft's
    // viewer) or a PDF on this site. A link can differ by language.
    demo: z
      .object({
        type: z.string().min(1),
        status,
        kind: z.enum(["powerbi", "excel-onedrive", "excel-viewer", "pdf"]).optional(),
        // Power BI: the report page to open first (and to draw for the file's board, npm run boards)
        page: z.string().min(1).optional(),
        url: z
          .union([z.string().min(1), z.object({ en: z.string().min(1), ar: z.string().min(1) })])
          .optional(),
      })
      .refine((demo) => demo.status !== "ready" || (demo.kind && demo.url), {
        message: "A demo marked ready needs its kind and url.",
      }),
    film: z
      .object({
        dir: z.string().startsWith("/films/"),
        status,
        lengthSec: z.number().int().positive(),
        /** The scene the silent loop is cut from (1-based). */
        loopScene: z.number().int().min(1).optional(),
        scenes: z.array(scene).optional(),
      })
      .refine(
        (film) =>
          (film.scenes ?? []).every(
            (item, index, all) =>
              item.end > item.start && item.end <= film.lengthSec && item.start >= (all[index - 1]?.end ?? 0),
          ),
        { message: "Film scenes must be in order, not overlap, and end within lengthSec." },
      ),
    downloads: z.array(
      z.object({
        file: z.string().startsWith("/downloads/"),
        kind: z.enum(["xlsx", "pdf", "pbit", "docx"]),
        status,
      }),
    ),
    en: copy,
    ar: copy,
  }),
});

export const collections = { projects };
