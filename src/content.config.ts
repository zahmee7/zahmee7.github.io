import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

// content/projects.json is the only source of project copy (CLAUDE.md > Content model).
// A wrong or missing field stops the build with a clear message.

const status = z.enum(["planned", "later", "ready"]);

const copy = z.object({
  short: z.string().min(1),
  tag: z.string().min(1),
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
    tone: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    demo: z.object({ type: z.string().min(1), status }),
    film: z.object({
      dir: z.string().startsWith("/films/"),
      status,
      lengthSec: z.number().int().positive(),
    }),
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
