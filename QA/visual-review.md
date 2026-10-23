# Independent visual and browser review

Status: **PASS — 18 of 18 browser tests** on 23 October 2026 UTC, after all reported corrections. Final command: `node node_modules/@playwright/test/cli.js test`. One Chrome worker, no retries, approximately 1.1 minutes. Final screenshots were regenerated and independently inspected, including the corrected downloaded Sol and Moon SVG cards. No unresolved P1/P2 or important P3 findings remain in the reviewed scope. Live deployment verification is recorded separately when available.

Story: a visitor enters KILN, reads its ceramic process story, chooses a vessel profile and glaze, adjusts bounded shape controls, rotates the digital study, then saves SVG and JSON derived from the current design. This is a static browser-only concept; no API or data service is part of the story.

Review method: UI Review and full-story Verification instructions, grounded screenshots, Playwright using installed Chrome 155.0.8059.86 on the user's Windows PC, isolated contexts, one worker, port 4178. No shared browser tabs or CUA session were used. Browser contexts contain no persistent user profile.

Acceptance: 320, 390, 768, 1440 and 844×390 layouts; keyboard/focus; reduced motion; WebGL fallback; idle/offscreen/hidden rendering; download state fidelity and repeated actions; no app exceptions or failed resources; axe WCAG A/AA.

## Findings and corrections

| Severity | Grounded finding | Correction and regression evidence |
|---|---|---|
| P2 | Axe found process-stamp contrast 1.4:1 over clay and process step numbers 4.38:1 against paper. | Stamp uses ink on paper backing; small clay text darkened. All five viewport axe checks pass in the final run. |
| P2 | Profile buttons excluded their visible 01/02/03 counters from custom accessible names; axe reported label-content-name-mismatch. | Natural button content now supplies the accessible name. All five viewport axe checks pass. |
| P2 | Exported card shadow was 118 pixels below the transformed vessel baseline. | Export now derives shadow position from shared ART_BASELINE. Rendered card screenshot confirms contact. |
| P2 | Actual rendered SVG exports showed heavy black bands: open decorative paths inherited the default black fill. | Ornament group uses fill="none". Browser test asserts computed fill of the wheel marks and captures all three cards for review. |
| Important P3 | At mobile 390px, primary navigation link height measured 41.5px against the project's 44px contract. | Integrator added 44px minimum height to navigation and story links. Browser regression measures both mobile and desktop targets. |
| Source prevention | At maximum Sol proportions the original SVG rim could exceed the viewBox. | Art scale adjusted before release; maximum Sol/Fold/Moon screenshots confirm no crop. |

Files relevant to fixes: `src/site.css`, `src/tokens.css`, `src/atelier/Atelier.tsx`, `src/atelier/export.ts`, `src/art/model.ts`.

## Visual evidence

Screenshots are actual local Chrome renders, not mockups:

- [Desktop hero](screenshots/local-desktop-hero.png), [desktop atelier](screenshots/local-desktop-atelier.png).
- [Readable mobile hero crop](screenshots/local-mobile-hero.png), [mobile 3D study](screenshots/local-mobile-atelier.png), [mobile controls](screenshots/local-mobile-controls.png).
- Full pages: [320](screenshots/local-320x760.png), [390](screenshots/local-390x844.png), [768](screenshots/local-768x1024.png), [1440](screenshots/local-1440x1000.png), [landscape](screenshots/local-844x390.png).
- Maximum forms: [Sol](screenshots/local-extreme-sol.png), [Fold](screenshots/local-extreme-fold.png), [Moon](screenshots/local-extreme-moon.png).
- Rendered downloaded cards: [Sol](screenshots/local-export-sol.png), [Fold](screenshots/local-export-fold.png), [Moon](screenshots/local-export-moon.png).
- [Illustrated WebGL fallback](screenshots/local-webgl-fallback.png), [changed Moon / Olive ash](screenshots/local-custom-moon-moss.png).

Independent visual inspection: strong asymmetric editorial hero; tactile authored vessels; consistent paper/indigo/clay material story. Mobile hierarchy and controls remain readable in the cropped captures. No horizontal overflow was measured at the five required sizes. Three maximum-proportion forms fit the tablet viewer. This aesthetic assessment is separate from deterministic test results.

## Scope and limits

- The hidden-state regression explicitly simulates `document.hidden` while the viewer is in view, changes rotation and viewport size, verifies no WebGL draws, then verifies drawing resumes on visibility restoration. It is not an OS-level background-tab test.
- WebGL is proven active by a positive draw count before idle assertions. Context-loss coverage uses the actual WEBGL_lose_context extension. The no-WebGL branch separately disables context creation and proves the illustrated fallback remains usable.
- SVG is explicitly a front-silhouette card; JSON preserves viewing rotation. Export fidelity tests compare downloaded metadata and state, selected profile/glaze, finite geometry, valid XML, and absence of executable/external content. Browser save cancellation and repeated downloads remain usable.
- These are desktop Chrome lab checks and responsive emulation, not physical iOS/Android or field Core Web Vitals measurements. Performance measurements are in the independent technical report.
- The independent command `npx --yes @21st-dev/cli review src --json` was denied by automatic approval review because it would download/execute an untrusted npm package and authorization for that exact third-party execution was considered insufficient. It was not retried or invoked indirectly. Parent's earlier successful initial CLI findings are separate evidence; no final CLI pass is claimed here. Playwright, axe, source and screenshot reviews were completed as safe substitutes.

Local environment history: initial sandbox browser navigation failed with ERR_NETWORK_ACCESS_DENIED, followed by an inaccessible server namespace. The integrator restarted the authorized server in the permitted network environment, endpoint 200 was confirmed, and all app checks then ran against that healthy endpoint. Failed pre-navigation attempts are not treated as app test results.
