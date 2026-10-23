import { ART_BASELINE, GLAZES, PROFILES, normalizeDesign, profilePoints, vesselPath } from '../art/model';

const CARD_VESSEL = { x: 210, y: 176, scale: 1.2 };

export function designDocument(input: unknown) {
  const design = normalizeDesign(input);
  return {
    schema: 'kiln.design/v1',
    studio: 'KILN',
    conceptOnly: true,
    note: 'A digital form study. This file is not a production specification or a promise of physical manufacturability.',
    design,
    profile: PROFILES.find((profile) => profile.id === design.profile)!,
    glaze: GLAZES.find((glaze) => glaze.id === design.glaze)!,
    profilePoints: profilePoints(design),
    representation: 'The SVG card is a front silhouette; JSON preserves the 3D viewing rotation.',
  };
}

export function createDesignJSON(input: unknown): string {
  return `${JSON.stringify(designDocument(input), null, 2)}\n`;
}

function xml(value: unknown): string {
  return String(value).replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!);
}

/** A portable, self-contained card; no external fonts, scripts, image URLs or browser capture. */
export function createDesignSVG(input: unknown): string {
  const document = designDocument(input);
  const { design, profile, glaze } = document;
  const path = vesselPath(design);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100" role="img" aria-labelledby="title description">
  <title id="title">KILN — ${xml(profile.name)} in ${xml(glaze.name)}</title>
  <desc id="description">Personal digital vessel study. Height ${design.height} percent, fullness ${design.fullness} percent, lip ${design.lip} percent. Front silhouette. Concept only.</desc>
  <metadata id="kiln-design">${xml(JSON.stringify(document))}</metadata>
  <defs>
    <linearGradient id="glaze" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#080914" stop-opacity=".52"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".12"/><stop offset=".6" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#080914" stop-opacity=".38"/></linearGradient>
    <radialGradient id="shadow"><stop stop-color="#252844" stop-opacity=".19"/><stop offset="1" stop-color="#252844" stop-opacity="0"/></radialGradient>
    <clipPath id="vessel"><path d="${path}"/></clipPath>
  </defs>
  <rect width="900" height="1100" fill="#f0e9dc"/>
  <path d="M54 143H846M54 904H846M54 1028H846" stroke="#bcb4a6"/>
  <g fill="#252844">
    <text x="54" y="105" font-family="Georgia,serif" font-size="75" letter-spacing="-5">KILN</text>
    <text x="846" y="72" text-anchor="end" font-family="Arial,sans-serif" font-size="12" letter-spacing="2">YOUR FORM, IN STUDY.</text>
    <text x="846" y="98" text-anchor="end" font-family="Arial,sans-serif" font-size="12" letter-spacing="1">ATELIER / DIGITAL EDITION</text>
  </g>
  <ellipse cx="450" cy="${CARD_VESSEL.y + ART_BASELINE * CARD_VESSEL.scale}" rx="242" ry="38" fill="url(#shadow)"/>
  <g transform="translate(${CARD_VESSEL.x} ${CARD_VESSEL.y}) scale(${CARD_VESSEL.scale})">
    <path d="${path}" fill="${xml(glaze.color)}"/>
    <path d="${path}" fill="url(#glaze)"/>
    <g clip-path="url(#vessel)" fill="none" stroke="#ffffff" stroke-opacity=".045" stroke-width="1">
      ${Array.from({ length: 52 }, (_, i) => `<path d="M0 ${30 + i * 9}Q200 ${34 + i * 9} 400 ${30 + i * 9}"/>`).join('')}
    </g>
  </g>
  <g fill="#252844">
    <text x="54" y="956" font-family="Georgia,serif" font-size="42">${xml(profile.name)} / ${xml(glaze.name)}</text>
    <text x="54" y="988" font-family="Arial,sans-serif" font-size="12" letter-spacing="1">HEIGHT ${design.height}%   ·   FULLNESS ${design.fullness}%   ·   LIP ${design.lip}%</text>
    <text x="846" y="958" text-anchor="end" font-family="Arial,sans-serif" font-size="12">FRONT SILHOUETTE</text>
    <text x="846" y="983" text-anchor="end" font-family="Arial,sans-serif" font-size="12">VIEW ROTATION ${design.rotation}°</text>
    <text x="54" y="1060" font-family="Arial,sans-serif" font-size="11">A digital form study. Not a production specification.</text>
    <text x="846" y="1060" text-anchor="end" font-family="Arial,sans-serif" font-size="11">KILN / FICTIONAL CERAMICS STUDIO</text>
  </g>
</svg>\n`;
}

export function designFilename(input: unknown, extension: 'svg' | 'json'): string {
  const design = normalizeDesign(input);
  return `kiln-${design.profile}-${design.glaze}.${extension}`;
}

/** Returns an idempotent cleanup so the component can release any outstanding URL. */
export function downloadFile(content: string, filename: string, mime: string, onCleanup?: (cleanup: () => void) => void): () => void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  let cleaned = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (timer) clearTimeout(timer);
    URL.revokeObjectURL(url);
    anchor.remove();
    onCleanup?.(cleanup);
  };
  try {
    window.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    timer = setTimeout(cleanup, 1500);
  } catch (error) {
    cleanup();
    throw error;
  }
  return cleanup;
}
