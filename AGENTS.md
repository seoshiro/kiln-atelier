# KILN atelier

This is an original static art concept. Work only in this repository. No checkout, payment, tracking, accounts, API keys, paid resources, or physical manufacturability claims. Existing projects are out of scope.

## Roles and ownership
- Integrator: root configuration, App.tsx, site.css, deployment, documentation.
- Art / 3D: src/art/**, public/art/**, geometry tests. Own original procedural vessel art and an on-demand Three.js viewer with SVG fallback.
- Interaction: src/atelier/** and unit tests for state/export. Own the complete atelier using the shared art API.
- Visual / browser QA: tests/e2e/**, QA/visual-review.md and release screenshots. Independent browser review, one Playwright worker, isolated contexts, port 4178.
- Code / performance / security QA: QA/technical-review.md and independent source/build audits. Report grounded findings to integrator; do not edit other roles' source files.

One integrator owns integration. Agents must not overwrite another role's files. Share API requirements before implementation. Do not create commits or publish independently.

## Engineering process
Use discover, plan, implement, verify, review, fix, reverify. Apply relevant UI Build/Review, React Review and full user-story verification skills. Read .agents/skills/release-quality.md. For large UI changes check actual browser screenshots and semantics; source inspection is not browser evidence.

## Product contract
3 vessel profiles (Sol, Fold, Moon), 4 glazes. Parameters are bounded height, fullness and lip. Sliders only (no fragile number typing). Controls have labels, visible focus and 44px targets. Profile selection preserves glaze and resets shape controls. Reset restores complete defaults. Keep a reliable undo history. Export deterministic SVG design card and JSON from the same normalized state and profile points as the viewer. Downloads must tolerate repetition and browser cancellation.

## Verification
Typecheck, lint, build, unit geometry/state/export tests, Playwright journey + axe. Sizes 320,390,768,1440 and landscape; keyboard, reduced motion, WebGL fallback, hidden/offscreen resource behavior. Render only when changed, never idle continuous GPU. Test with installed Chrome, workers: 1; standard CI runner preinstalled Chrome. No apt browser dependency installations.

## Art API contract
src/art/model.ts exports ProfileId, GlazeId, DesignState {profile, glaze, height, fullness, lip, rotation}, DEFAULT_DESIGN, PROFILES [{id,name,note}], GLAZES [{id,name,color,note}], normalizeDesign(input), profilePoints(state) -> {x,y}[] in model units y 0..height, closed hollow cross-section with open mouth; vesselPath(state) -> SVG path in fixed viewBox 0 0 400 500. SVG uses same silhouette, not a screen capture.
src/art/VesselArt.tsx exports VesselArt({design?, className?, label?}) static expressive SVG used in hero/collection/export-fallback; and src/art/VesselViewer.tsx exports VesselViewer({design,onRotate}) with onRotate(deltaDegrees:number) callback. Agent art can propose adjustments via message, keep this simple API stable.
src/atelier/Atelier.tsx exports default Atelier, includes its own atelier.css and section id atelier.
