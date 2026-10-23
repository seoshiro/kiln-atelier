# Independent technical review

Reviewer: code / performance / security agent, separate from implementation and visual QA. Scope: the new KILN repository only. Review uses the project release rules, ECC-derived frontend and security workflow, and React Review guidelines. This is a focused engineering audit, not a claim of complete security.

## Findings and fixes

No P1 defect was found. The following defects were independently identified and sent to their owners before release:

| Priority | Finding and original location | Resolution / evidence |
| --- | --- | --- |
| P2 | `src/art/VesselArt.tsx:34`: the tallest, fullest Sol rim extended above the SVG viewport | Shared `ART_SCALE` reduced to 103. Independent sweep of all 324 combinations of three profiles, four glazes and 70/100/130 values for three dimensions passed; minimum rim top is 8.323 px. |
| P2 | `src/atelier/state.ts:61` and viewer pointer events: each drag event consumed an undo slot, so one drag could discard prior work | Transient rotation plus `onRotateEnd` commits a complete drag as one adjustment. Regression unit test includes 180 moves and preserves the prior glaze adjustment. |
| P2 | `src/atelier/export.ts:48`: SVG card shadow was 118 px below the transformed vessel foot | Shadow now derives from the shared baseline and card transform. Unit regression parses the actual SVG path/transform for three profiles and two height extremes; it verifies grounding within 1 px and clearance from caption/masthead. Exported-card screenshots are independently reviewed in the visual report. |
| P3 | Reset status hardcoded Sol / Ink while the actual default was Moon / Midnight ink | Status now derives from model metadata. |
| P3 | Desktop range controls were 32 px high, below the project 44 px target | All range controls now use 44 px height. |
| P3 | Viewer accessibility helper used `.sr-only` without its CSS definition | Local visually hidden utility added in `src/art/vessel.css`. |
| Build blocker | ESLint globals did not cover new `.mjs` release scripts | Root ESLint override added; full lint passes. |

## Verification evidence

Reviewed on 23 October 2026: application, model, viewer, state reducer, exporter, unit tests, styling contracts, lockfile, CI workflow, release manifest, live hash verifier and licenses.

| Area | Status | Evidence |
| --- | --- | --- |
| State/input boundary | PASS | Known profile/glaze enum selection, finite numeric checks, 70–130 bounds, normalized rotation; native range inputs avoid intermediate numeric typing errors. Independent 332-case geometry/normalization sweep passed. |
| Export coherence and sinks | PASS | SVG and JSON use `normalizeDesign`, `profilePoints` and `vesselPath`; JSON includes viewing rotation, while SVG explicitly identifies its front silhouette representation. XML strings are escaped; all profile/glaze strings come from known constants. No raw HTML sink or dynamic script evaluation. |
| Download lifecycle | PASS (source + units) | Blob URLs are revoked after consumption or on unmount. Cleanup is idempotent and exception path removes the temporary anchor. Browser journey/cancellation evidence belongs to the visual report. |
| React Review | PASS | Strict TypeScript; reducer holds design/history coherently; stable callbacks for drag; effects synchronize renderer and dispose observers/listeners/resources; no effect-driven derived state or runtime data fetch. |
| WebGL lifecycle | PASS (source + local browser) | Import begins on intersection. No RAF, animation loop or interval exists. `canRender` gates on intersection, `document.hidden` and context loss. Geometry, materials, textures, renderer and listeners are disposed. Context loss switches to SVG; no-WebGL browser evidence belongs to visual QA. |
| Local lint | PASS | `npm run lint`, exit 0 after `.mjs` globals fix. |
| Local typecheck | PASS | `npm run typecheck`, exit 0. |
| Unit suite | PASS | Final independent `npm test`: 3 files, 41 tests. Geometry/state/export, including extreme values, grouped drag, grounding and Blob cleanup regressions. |
| CI configuration | PASS (source) | Verify job has `contents: read`; deploy job has only `pages: write` and `id-token: write`. No secrets or API tokens are consumed by this application. CI uses runner Chrome and one Playwright worker, without apt installation. Actual workflow result is recorded by the integrator after execution. |
| Release identity | PASS (source) | Build manifest records exact Git SHA and SHA-256 per built asset. Live verifier checks expected SHA, HTTP status and every asset hash. Live execution remains an integrator release gate. |
| Dependency advisories | PASS | `npm audit --json`: 0 critical/high/moderate/low/info, 227 reported dependencies. The command sends the dependency manifest to the public npm registry; no credentials were inspected. |
| Supply chain and licensing | PASS | Lockfile v3 resolves only from `registry.npmjs.org`; the only `hasInstallScript` entry is optional `fsevents@2.3.3`. Font license copies are byte-identical to installed package licenses (OFL-1.1). Fonts are self-hosted Latin subsets; code/art MIT. |

The application has no runtime network API, storage, payment, account or tracking code. Pattern checks were used only as triage; source inspection established the state and export boundaries. No credential files were read.

## Local production lab baseline

Measured in installed Chrome 155.0.8059.86 on Windows, Node 24.18.0, AMD Ryzen 5 7535HS, 12 logical processors, 15.3 GiB RAM, headless viewport 1440 × 1000, DPR 1, unthrottled CPU/network, local Vite production preview on isolated port 4180. Three fresh browser contexts ran sequentially in one browser. Browser HTTP caches were fresh per context; OS/process caches and concurrent development workloads were uncontrolled. Metrics below describe a pre-release local build, not real users or field Core Web Vitals.

| Metric | Run 1 | Run 2 | Run 3 |
| --- | ---: | ---: | ---: |
| First contentful paint (ms) | 352 | 52 | 56 |
| Largest contentful paint observed (ms) | 624 | 260 | 276 |
| Cumulative layout shift observed | 0.00339 | 0.00345 | 0.00339 |
| Atelier visibility to first WebGL frame (ms) | 422.5 | 217.9 | 222.7 |
| Initial resource requests | 8 | 8 | 8 |
| Initial encoded resource bytes | 201,127 | 201,127 | 201,127 |
| Requests after entering atelier | 9 | 9 | 9 |
| Encoded resource bytes after atelier | 386,404 | 386,404 | 386,404 |

In every run, Three.js was absent at the page top and requested after entering the atelier. Viewer render count stayed 1 → 1 across 750 ms idle and 1 → 1 when a rotation was triggered programmatically while offscreen. No page JavaScript errors occurred in these lab runs. The visibility gate is also explicit in source; genuine hidden-tab lifecycle coverage is described in visual/browser QA rather than inferred from idle counts.

Latest release-candidate bundle: main JavaScript `index-DRZ3HkYO.js` 235,942 bytes raw / 73,458 gzip; deferred atelier `Atelier-C2MtninK.js` 17,890 / 6,579; deferred Three.js `three.module-CDJkRhUe.js` 736,437 / 185,277; three WOFF2 assets total 113,832 bytes. The manifest covers 15 files, including licenses. Gzip figures use Node `gzipSync`; browser encoded-byte figures come from Resource Timing and exclude document transfer/headers. Three.js remains the dominant optional payload. No before/after optimization claim is made.

## Frozen candidate independent browser recheck

The frozen candidate with `Atelier-D8YXOH65.js` was checked again on the same machine and isolated port. A subsequent semantic-only update to accessible profile names produced the latest chunks listed above; browser metrics below describe the earlier candidate and were not rerun for that label change. At the top it requested 8 resources / 201,304 encoded bytes, without Three.js. A real Playwright mouse drag with 100 movement steps changed rotation to 133.682 degrees; one Undo restored the entire pre-drag state, and the next Undo restored the earlier ink glaze. Browser-downloaded JSON was used to compare states, rather than calling the reducer directly.

The WebGL counter stayed 104 → 104 for 500 ms idle. With the viewer in view, a simulated `document.hidden = true` plus a rotation kept it at 104; restoring visibility rendered frame 105. This is a direct test of the hidden-document gate, not a claim about OS window occlusion. No page JavaScript errors occurred. Final lint, typecheck and 41 units passed independently. The build manifest at local audit time identified `uncommitted-local`; production identity is established by the subsequent CI/live checks.

## Remaining gates / limits

No unresolved P1/P2 technical finding remains in the audited candidate. The integrator must still record the independent full visual/browser suite, actual CI conclusion and live exact-SHA/hash verification before publication is claimed; those release results belong in `QA/RELEASE.md`. The local audit does not establish cross-browser compatibility, physical ceramic safety, manufacturability, or field performance.
