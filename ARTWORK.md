# Original Blender ceramic studies

The four PNG studies in `src/art/studies` were modeled and rendered in Blender 5.2.2 LTS: continuous hollow cross sections, applied 128-step Screw surfaces, smooth normals, mineral bump material, studio area lights and Cycles CPU rendering on clean transparent film. They replace the static striped vector shading in the hero and form library. Each image retains a named vector fallback when loading fails. Subtle CSS shadows preserve a clean editorial frame without a baked floor rectangle.

Sol, Fold and Moon keep their existing profiles and glazes. The live atelier remains parameterized: height, fullness, lip, rotation, Undo, Reset and current SVG/JSON exports continue to share the normalized profile API. A static GLB replacement would break that contract. Blender supplies the authored base prototypes and production static renders; Three.js keeps the meaningful runtime deformations. The editable `.blend` is saved with the audit workspace; the GLB reference mesh library, previews and operation log accompany the audit release. We do not claim that the interactive viewer loads the GLB. PNG text metadata is stripped losslessly before publication; pixel and color chunks are unchanged.

All new artwork is original and covered by the repository's MIT license. No external models, textures, generation service or paid tool is used.
