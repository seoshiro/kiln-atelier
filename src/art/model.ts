export type ProfileId = 'sol' | 'fold' | 'moon';
export type GlazeId = 'ink' | 'clay' | 'chalk' | 'moss';

export interface DesignState {
  profile: ProfileId;
  glaze: GlazeId;
  height: number;
  fullness: number;
  lip: number;
  rotation: number;
}

export const PROFILES = [
  { id: 'sol' as const, name: 'Sol', note: 'A quiet vertical. A generous shoulder.' },
  { id: 'fold' as const, name: 'Fold', note: 'A softened edge. A moment held open.' },
  { id: 'moon' as const, name: 'Moon', note: 'Full-bodied. Almost a small world.' },
];

export const GLAZES = [
  { id: 'ink' as const, name: 'Midnight ink', color: '#303951', note: 'Deep indigo, satin finish' },
  { id: 'clay' as const, name: 'Burnt earth', color: '#ac563d', note: 'Warm terracotta, dry finish' },
  { id: 'chalk' as const, name: 'Oat milk', color: '#d9ccb3', note: 'Soft ivory, mineral finish' },
  { id: 'moss' as const, name: 'Olive ash', color: '#72795a', note: 'Muted green, ash finish' },
];

export const PARAMETER_LIMITS = {
  height: { min: 70, max: 130, step: 1 },
  fullness: { min: 70, max: 130, step: 1 },
  lip: { min: 70, max: 130, step: 1 },
} as const;

export const DEFAULT_DESIGN: Readonly<DesignState> = Object.freeze({
  profile: 'moon', glaze: 'ink', height: 100, fullness: 100, lip: 100, rotation: 0,
});

function bounded(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value)) : fallback;
}

/** Treat persisted and exported state as untrusted. Only known finite fields survive. */
export function normalizeDesign(input: unknown): DesignState {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const rotation = bounded(raw.rotation, 0, -1e6, 1e6);
  return {
    profile: PROFILES.some(({ id }) => id === raw.profile) ? raw.profile as ProfileId : DEFAULT_DESIGN.profile,
    glaze: GLAZES.some(({ id }) => id === raw.glaze) ? raw.glaze as GlazeId : DEFAULT_DESIGN.glaze,
    height: bounded(raw.height, 100, 70, 130),
    fullness: bounded(raw.fullness, 100, 70, 130),
    lip: bounded(raw.lip, 100, 70, 130),
    rotation: ((rotation % 360) + 360) % 360,
  };
}

type Knot = readonly [number, number]; // relative height, radius
const SHAPES: Record<ProfileId, { height: number; knots: readonly Knot[] }> = {
  sol: { height: 3.18, knots: [[0, .49], [.035, .51], [.13, .6], [.39, .82], [.63, .79], [.79, .5], [.9, .34], [.98, .36], [1, .38]] },
  fold: { height: 2.60, knots: [[0, .60], [.045, .64], [.15, .87], [.4, 1.13], [.6, 1.09], [.77, .83], [.9, .64], [.965, .72], [1, .80]] },
  moon: { height: 2.92, knots: [[0, .54], [.035, .59], [.13, .91], [.32, 1.22], [.50, 1.30], [.67, 1.19], [.82, .89], [.92, .54], [.975, .45], [1, .47]] },
};

// Cubic Hermite interpolation with finite tangent differences gives a continuous
// profile without relying on renderer-specific curves.
function radiusAt(knots: readonly Knot[], y: number): number {
  let i = 0;
  while (i < knots.length - 2 && y > knots[i + 1][0]) i++;
  const a = knots[i], b = knots[i + 1];
  const previous = knots[Math.max(0, i - 1)], next = knots[Math.min(knots.length - 1, i + 2)];
  const span = b[0] - a[0], t = (y - a[0]) / span;
  const m0 = (b[1] - previous[1]) / (b[0] - previous[0]);
  const m1 = (next[1] - a[1]) / (next[0] - a[0]);
  return (2*t*t*t - 3*t*t + 1)*a[1] + (t*t*t - 2*t*t + t)*span*m0
    + (-2*t*t*t + 3*t*t)*b[1] + (t*t*t - t*t)*span*m1;
}

export interface ProfilePoint { x: number; y: number }

/** Shared outer profile: these exact samples define the model and card silhouette. */
export function outerProfile(input: unknown): ProfilePoint[] {
  const design = normalizeDesign(input), shape = SHAPES[design.profile];
  const points: ProfilePoint[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = i / 96;
    const lipWeight = Math.pow(Math.max(0, (t - .75) / .25), 2);
    const lipFactor = 1 + (design.lip / 100 - 1) * lipWeight;
    points.push({ x: Math.max(.12, radiusAt(shape.knots, t) * design.fullness / 100 * lipFactor), y: t * shape.height * design.height / 100 });
  }
  return points;
}

/** Hollow closed cross-section for a lathe. Mouth remains open; base has thickness. */
export function profilePoints(input: unknown): ProfilePoint[] {
  const outer = outerProfile(input), top = outer.at(-1)!;
  const thickness = .075;
  const inner = outer.slice(4).reverse().map(({ x, y }) => ({ x: Math.max(.03, x - thickness), y }));
  return [
    { x: 0, y: 0 }, ...outer,
    { x: top.x - thickness * .22, y: top.y + .018 },
    { x: top.x - thickness * .78, y: top.y + .018 },
    ...inner,
    { x: 0, y: .13 },
  ];
}

// Reserve mouth-ellipse headroom for the tallest/widest permitted Sol.
export const ART_SCALE = 103;
export const ART_BASELINE = 450;

export function vesselPath(input: unknown): string {
  const outer = outerProfile(input);
  const side = (sign: number, points: ProfilePoint[]) => points.map(({ x, y }) => `${(200 + sign*x*ART_SCALE).toFixed(3)},${(ART_BASELINE-y*ART_SCALE).toFixed(3)}`).join(' L');
  return `M${side(1, outer)} L${side(-1, [...outer].reverse())} Z`;
}

/** Safe color math used by authored illustration and procedural material textures. */
export function mixColor(hex: string, toward: string, weight: number): string {
  const a = parseInt(hex.slice(1), 16), b = parseInt(toward.slice(1), 16);
  return '#' + [16, 8, 0].map(shift => Math.round(((a >> shift) & 255)*(1-weight) + ((b >> shift) & 255)*weight).toString(16).padStart(2, '0')).join('');
}
