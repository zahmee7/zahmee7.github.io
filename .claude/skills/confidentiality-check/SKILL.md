---
name: confidentiality-check
description: Scan site copy, sample data, film captions and downloads for employer-specific or confidential details before committing. Use before any commit that touches content/, src/data/samples/, public/films/ captions or public/downloads/.
---

# Confidentiality check

The public site is a trailer. This check keeps employer-specific detail off it.

## Steps

1. List what changed: `git diff --name-only HEAD` plus untracked files.
2. For every changed text file (`.json`, `.astro`, `.ts`, `.tsx`, `.md`, `.vtt`, `.csv`):
   - Flag any digit sequence that is not clearly UI (years in the footer, step numbers 01–06, sample data inside `src/data/samples/`).
   - Flag percentages, "x" multipliers (5x), plus signs after numbers (10,000+), fractions like 67/127.
   - Flag these words in EN or AR: audit, finding, stalled, next cycle, internal, confidential, the employer's name, team size wording ("team of", "فريق من").
   - Flag real person names other than Mohammed Alzahmah / محمد آل زاحمة.
3. For sample data files: confirm the entity is fictional ("Sample Authority" / "الجهة التجريبية"), numbers are round, and the page shows the Sample data badge.
4. For downloads (`.xlsx`, `.docx`, `.pdf`, `.pbit`): unzip Office files and grep `docProps/core.xml` and `docProps/app.xml` for author, company and last-modified-by. They must be empty or "Mohammed Alzahmah". Grep sheet text for the flags above.
5. For images and video posters: remind the owner to confirm visually that no internal screen, logo or name appears.

## Output

A short table: file, line, flagged text, reason, suggested fix. End with PASS or FAIL. On FAIL, do not commit; propose fixes and wait for the owner.
