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

Initial production release: `cccfd6c12d279b038faca6f7cf2ead4fff94a709`.

- [CI and deployment run 40034988053](https://github.com/seoshiro/kiln-atelier/actions/runs/40034988053): SUCCESS. Actual logs show 41 units and 18 browser tests passed (52.7 seconds), using one installed Chrome worker. Lint, typecheck and build also passed; deploy completed.
- `node scripts/verify-live.mjs`: PASS against that exact SHA; all 15 served asset SHA-256 hashes matched the deployed manifest.
- Independent live browser regression and screenshots are recorded in `visual-review.md`; its live result remains separate from local and CI evidence.
- Independent live regression: PASS, the unchanged 18-test suite, one Windows Chrome 155 worker, no retries, about 1.1 minutes. Live hero, mobile, maximum forms, fallback and rendered downloaded cards were inspected. All five live viewport axe scans had zero violations.
- [Final built file sizes](bundle-sizes.json) include raw and Node gzip byte counts. All 15 local production file hashes matched the deployed CI manifest before recording these sizes. Earlier browser timing measurements in the technical report retain their stated candidate/workload conditions.

The evidence archive update changes QA documents and screenshots only. The latest exact source identity remains the served manifest; every main-branch push runs the complete verification/deployment workflow. Final release identity and final live verification are also recorded in the GitHub release notes.

## Limits

Local lab performance measurements are recorded with conditions and variability. They are not field Core Web Vitals. Browser QA covers installed Chrome on Windows and Chrome on the CI runner; no broad cross-browser or physical-device claim is made. Hidden-document gating includes a direct simulated visibility test; it is not an OS occlusion measurement.

The initial integrator-run 21st CLI review found two placeholder home anchors, which were replaced by real `#top` destinations. Its color-token suggestions were reviewed as intentional authored art/material colors. The independent CLI rerun was **DENIED** by automatic approval review because it would execute a third-party npm package. That action was stopped and not retried. Independent source review, grounded screenshots, Playwright and axe continued; no clean CLI rerun is claimed.
