# KILN — Form, feeling, fire.

An original fictional ceramics studio and interactive digital atelier. Warm paper, terracotta, midnight indigo, sculptural vessel studies and an asymmetric editorial layout. No products are sold; there are no payments, accounts, tracking, fabricated reviews or orders.

**[Open the studio](https://seoshiro.github.io/kiln-atelier/)** · [Public QA evidence](QA/README.md) · [Release screenshots](QA/screenshots/)

## The atelier

Choose Sol, Fold or Moon; adjust height, fullness and lip opening within deliberately limited bounds; select one of four glazes; drag or use keyboard-accessible buttons to rotate. Undo restores an adjustment and Reset returns the complete default study.

Download a self-contained **SVG design card** and **JSON study**. Both derive from the same normalized state and sampled geometry as the preview. The SVG is a front silhouette, not a screenshot of the current camera angle. JSON preserves viewing rotation, exact parameters, glaze and hollow profile samples. No files or designs are sent to a server. Browser downloads may be cancelled and repeated.

These are artistic form explorations. They are **not fabrication plans, engineering specifications, food-safe designs, or promises of physical manufacturability**. SVG illustration and WebGL lighting intentionally have different material interpretation. Unsupported or lost WebGL falls back to an original illustrated vessel; all design controls and exports remain available.

## Run locally

Requires Node.js 24 and npm. All runtime assets are self-hosted.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4178/kiln-atelier/`. Build and preview with `npm run build` and `npm run preview`.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

Playwright uses the installed Chrome executable, isolated browser contexts and **one worker**. Set `CHROME_PATH` to an existing Chrome binary if necessary. On GitHub's standard Ubuntu runner the suite uses `/usr/bin/google-chrome`; it does not install Chromium through apt. Set `BASE_URL` to test the deployed site. `npm run build` writes a release manifest containing the exact Git SHA and SHA-256 of every built asset. `node scripts/verify-live.mjs` compares the live release identity and all asset hashes.

## Implementation and resource policy

React, TypeScript and Vite. Heavy Three.js is imported only when the atelier object enters view. Rendering is event driven: geometry, finish, rotation, resize or visibility changes; there is no idle animation loop. Rendering is gated offscreen and in a hidden tab. Pixel ratio is capped at 1.5; geometry, textures, listeners and renderer are disposed. Static hero and collection vessels are original procedural SVGs and require no GPU. Reduced motion disables decorative transitions and smooth scrolling.

All visuals, procedural ceramic profiles, material textures and abstract studio illustration were authored for this project. No stock imagery, 3D marketplaces, generators, hosted APIs or paid resources were used. Font files are locally bundled Latin subsets of **Cormorant Garamond** and **DM Sans**, distributed under SIL Open Font License 1.1. React, React DOM and Three.js use MIT licenses. Copies are in [licenses](licenses/) and are copied into each deployed release. Application code and original artwork are MIT licensed. Other development packages retain their own licenses in their package metadata.

## Roles and verification

Five actual agents worked with separate ownership: integration/art direction; procedural art/3D; interaction/state/export; independent visual/browser QA; independent code/performance/security QA. Project instructions are in [AGENTS.md](AGENTS.md). Applied instructions included ECC-derived Windows engineering, 21st UI Build and UI Review, React Review and Full-Story Verification. Free 21st catalog metadata search returned an error; no component code or generator was purchased. Deterministic CLI review and grounded browser reviews are recorded in QA.

GitHub Actions runs lint, typecheck, units, production build and the full one-worker Playwright/axe suite before deploying free GitHub Pages. Browser evidence is retained as a workflow artifact. QA reports distinguish measured local lab evidence from unmeasured real-user performance; no field Core Web Vitals claim is made.

Rollback: redeploy a previously passing Git commit using the same workflow, or revert a change and let verification publish the new commit. The site has no database or user data to migrate.
