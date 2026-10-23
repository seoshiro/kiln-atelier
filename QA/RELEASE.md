# Release verification

## Local release candidate

23 October 2026. New, isolated KILN project; existing projects were not modified. Free resources only. Five actual roles: integrator, art/3D, interaction, independent visual/browser QA, independent code/performance/security QA. Ownership and engineering instructions are in `AGENTS.md` and `.agents/skills/release-quality.md`.

- Lint: PASS.
- Typecheck: PASS.
- Units: PASS, 41 tests across geometry, state and export.
- Production build: PASS. Three.js is a separate optional chunk; its size warning is retained rather than suppressed.
- Browser/axe: PASS, 18 of 18 tests, one installed Chrome 155 worker, no retries, 1.1 minutes. Five viewport axe scans found zero violations. Grounded screenshots and fixes are recorded in `visual-review.md`.
- Technical review: no unresolved P1/P2 findings in `technical-review.md`.

The site exports a front-silhouette SVG design card and JSON with exact current shape, glaze, parameters and rotation. It is a fictional art concept, not a store or a fabrication tool.

## Release identity and deployment

The authoritative source SHA and SHA-256 hashes of all deployed files are served at [release.json](https://seoshiro.github.io/kiln-atelier/release.json). The manifest excludes itself to avoid a circular hash. Five third-party license notices are part of the hashed deployed assets.

GitHub Actions must pass lint, typecheck, all 41 units, production build and the full installed-Chrome browser suite before the free Pages deployment job. The workflow uses one Playwright worker and runner-provided Chrome, with no apt browser installation.

Actual workflow, post-deployment SHA/hash verification, live browser results and release screenshots are added after deployment. They are not claimed before execution.

## Limits

Local lab performance measurements are recorded with conditions and variability. They are not field Core Web Vitals. Browser QA covers installed Chrome on Windows and Chrome on the CI runner; no broad cross-browser or physical-device claim is made. Hidden-document gating includes a direct simulated visibility test; it is not an OS occlusion measurement.

The initial integrator-run 21st CLI review found two placeholder home anchors, which were replaced by real `#top` destinations. Its color-token suggestions were reviewed as intentional authored art/material colors. The independent CLI rerun was **DENIED** by automatic approval review because it would execute a third-party npm package. That action was stopped and not retried. Independent source review, grounded screenshots, Playwright and axe continued; no clean CLI rerun is claimed.
