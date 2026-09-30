---
name: ship-check
description: Run the definition-of-done checks for a phase (build, astro check, Playwright EN/AR desktop and mobile, axe, screenshots, reduced motion) and report results. Use at the end of every phase or before pushing.
---

# Ship check

Run these in order and stop at the first hard failure.

1. `npm run build`
2. `npm run check` (astro check). Expect 0 errors, 0 warnings.
3. `npx playwright test` across all projects (desktop, pixel, iphone) in `en` and `ar`.
4. Accessibility: the axe spec in `tests/a11y.spec.ts` must report 0 violations on `/en/`, `/ar/`, one project page and one demo page per locale.
5. Screenshots: run `npx playwright test tests/visual.spec.ts --update-snapshots` only when the owner approved a visual change; otherwise compare. Save a fresh set to `test-results/review/` for these states:
   - home closed, home with a file open, project page, demo page
   - desktop 1440 and mobile 390
   - en and ar
6. Reduced motion: re-run the cabinet spec with `reducedMotion: 'reduce'` and confirm the file still opens, closes and restores focus.
7. Console: fail if any page logs an error or warning.
8. If copy or assets changed, run the `confidentiality-check` skill.

## Report

Reply to the owner in Arabic with English terms on their own lines:

- what passed
- what failed, with the file and a one-line cause
- the screenshot folder path
