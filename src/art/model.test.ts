import { describe, expect, it } from 'vitest';
import { ART_BASELINE, ART_SCALE, DEFAULT_DESIGN, GLAZES, normalizeDesign, outerProfile, profilePoints, PROFILES, vesselPath } from './model';

describe('normalized design boundary', () => {
  it('fills missing and invalid state with safe defaults', () => {
    expect(normalizeDesign(null)).toEqual(DEFAULT_DESIGN);
    expect(normalizeDesign({ height: NaN, fullness: Infinity, lip: -Infinity, profile: '<script>', glaze: 'bad', rotation: NaN })).toEqual(DEFAULT_DESIGN);
  });
  it('clamps finite extreme values and wraps rotation', () => {
    expect(normalizeDesign({ height: -900, fullness: 1e300, lip: 0, rotation: -90 })).toMatchObject({ height: 70, fullness: 130, lip: 70, rotation: 270 });
  });
  it('does not coerce strings and returns detached objects', () => {
    const state = normalizeDesign({ height: '120' }); expect(state.height).toBe(100);
    state.height = 120; expect(DEFAULT_DESIGN.height).toBe(100);
  });
});

describe('shared procedural profile', () => {
  for (const { id } of PROFILES) for (const percent of [70, 100, 130]) {
    it(`${id} at ${percent}% is finite, bounded, hollow, and closed at base`, () => {
      const state = { ...DEFAULT_DESIGN, profile: id, height: percent, fullness: percent, lip: percent };
      const outer = outerProfile(state), section = profilePoints(state);
      expect(outer).toHaveLength(97);
      expect(outer.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x > 0 && p.x < 2 && p.y >= 0 && p.y < 4.2)).toBe(true);
      expect(outer.every((p, i) => i === 0 || p.y > outer[i-1].y)).toBe(true);
      expect(section[0]).toEqual({ x: 0, y: 0 });
      expect(section.at(-1)).toEqual({ x: 0, y: .13 });
      const top = outer.at(-1)!;
      expect(section.some(p => p.x < top.x && p.x > 0 && p.y >= top.y)).toBe(true);
      expect(vesselPath(state)).not.toMatch(/NaN|Infinity/);
      expect(vesselPath(state)).toMatch(/^M.* Z$/);
    });
  }
  it('different profiles and parameters create different silhouette paths', () => {
    expect(new Set(PROFILES.map(({ id }) => vesselPath({ ...DEFAULT_DESIGN, profile: id }))).size).toBe(3);
    expect(vesselPath(DEFAULT_DESIGN)).not.toBe(vesselPath({ ...DEFAULT_DESIGN, lip: 130 }));
    expect(vesselPath(DEFAULT_DESIGN)).not.toBe(vesselPath({ ...DEFAULT_DESIGN, height: 70 }));
  });
  it('glaze and rotation preserve rotationally symmetric geometry', () => {
    for (const { id } of GLAZES) expect(vesselPath({ ...DEFAULT_DESIGN, glaze: id, rotation: 137 })).toBe(vesselPath(DEFAULT_DESIGN));
  });
  it('all independent parameter extremes fit the fixed SVG including the open rim', () => {
    for (const { id } of PROFILES) for (const height of [70, 130]) for (const fullness of [70, 130]) for (const lip of [70, 130]) {
      const outer = outerProfile({ ...DEFAULT_DESIGN, profile: id, height, fullness, lip });
      const top = outer.at(-1)!;
      expect(ART_BASELINE-top.y*ART_SCALE-Math.max(6, top.x*ART_SCALE*.24)).toBeGreaterThan(0);
      expect(outer.every(p => 200-p.x*ART_SCALE > 0 && 200+p.x*ART_SCALE < 400)).toBe(true);
      expect(ART_BASELINE).toBeLessThan(500);
    }
  });
});
