import { describe, expect, it } from 'vitest';
import { DEFAULT_DESIGN, normalizeDesign } from '../art/model';
import { HISTORY_LIMIT, atelierReducer, createHistory } from './state';

describe('atelier state and undo', () => {
  it('starts at an independent normalized default state', () => {
    const state = createHistory();
    expect(state.present).toEqual(DEFAULT_DESIGN);
    expect(state.present).not.toBe(DEFAULT_DESIGN);
    expect(state.past).toEqual([]);
    expect(state.gesture).toBeNull();
  });

  it('normalizes unknown initial inputs', () => {
    expect(createHistory(null).present).toEqual(DEFAULT_DESIGN);
    expect(createHistory({ profile: 'unknown', height: Infinity, fullness: -9999, lip: 9999 }).present).toEqual({ ...DEFAULT_DESIGN, fullness: 70, lip: 130 });
  });

  it('bounds all parameter updates before rendering', () => {
    const state = atelierReducer(createHistory(), { type: 'patch', patch: { height: -1e10, fullness: 1e10, lip: NaN } });
    expect(state.present.height).toBe(70);
    expect(state.present.fullness).toBe(130);
    expect(state.present.lip).toBe(100);
    expect(Object.values(state.present).filter((value) => typeof value === 'number').every(Number.isFinite)).toBe(true);
  });

  it('does not store an unchanged or invalid patch', () => {
    const original = createHistory();
    expect(atelierReducer(original, { type: 'patch', patch: { height: 100 } })).toBe(original);
    expect(atelierReducer(original, { type: 'patch', patch: { height: Infinity } })).toBe(original);
  });

  it('groups a complete slider gesture into one undo step', () => {
    let state = createHistory();
    for (const height of [102, 108, 112, 119]) state = atelierReducer(state, { type: 'patch', patch: { height }, transient: true });
    expect(state.present.height).toBe(119);
    expect(state.past).toHaveLength(0);
    state = atelierReducer(state, { type: 'commit' });
    expect(state.past).toHaveLength(1);
    state = atelierReducer(state, { type: 'undo' });
    expect(state.present).toEqual(DEFAULT_DESIGN);
    expect(state.past).toHaveLength(0);
  });

  it('can undo an uncommitted slider gesture', () => {
    const state = atelierReducer(createHistory(), { type: 'patch', patch: { lip: 80 }, transient: true });
    expect(atelierReducer(state, { type: 'undo' })).toEqual(createHistory());
  });

  it('drops an unchanged gesture without creating history', () => {
    let state = atelierReducer(createHistory(), { type: 'patch', patch: { fullness: 90 }, transient: true });
    state = atelierReducer(state, { type: 'patch', patch: { fullness: 100 }, transient: true });
    expect(atelierReducer(state, { type: 'commit' })).toEqual(createHistory());
  });

  it('retains both a slider gesture and subsequent glaze adjustment', () => {
    let state = atelierReducer(createHistory(), { type: 'patch', patch: { height: 115 }, transient: true });
    state = atelierReducer(state, { type: 'patch', patch: { glaze: 'clay' } });
    expect(state.past).toHaveLength(2);
    state = atelierReducer(state, { type: 'undo' });
    expect(state.present.height).toBe(115);
    expect(state.present.glaze).toBe(DEFAULT_DESIGN.glaze);
    expect(atelierReducer(state, { type: 'undo' }).present).toEqual(DEFAULT_DESIGN);
  });

  it('profile choice preserves glaze and resets shape and view', () => {
    let state = createHistory({ ...DEFAULT_DESIGN, glaze: 'moss', height: 122, lip: 79, fullness: 88, rotation: 165 });
    state = atelierReducer(state, { type: 'profile', profile: 'sol' });
    expect(state.present).toEqual({ ...DEFAULT_DESIGN, profile: 'sol', glaze: 'moss' });
    expect(atelierReducer(state, { type: 'undo' }).present.rotation).toBe(165);
  });

  it('reset restores every original field and can itself be undone', () => {
    const custom = normalizeDesign({ ...DEFAULT_DESIGN, profile: 'fold', glaze: 'chalk', height: 130, fullness: 70, lip: 129, rotation: 15 });
    const state = atelierReducer(createHistory(custom), { type: 'reset' });
    expect(state.present).toEqual(DEFAULT_DESIGN);
    expect(atelierReducer(state, { type: 'undo' }).present).toEqual(custom);
    expect(atelierReducer(createHistory(), { type: 'reset' })).toEqual(createHistory());
  });

  it('rotation wraps and rejects nonfinite deltas', () => {
    let state = atelierReducer(createHistory(), { type: 'rotate', delta: -15 });
    expect(state.present.rotation).toBe(345);
    state = atelierReducer(state, { type: 'rotate', delta: 30 });
    expect(state.present.rotation).toBe(15);
    expect(atelierReducer(state, { type: 'rotate', delta: NaN })).toBe(state);
    expect(atelierReducer(state, { type: 'rotate', delta: Infinity })).toBe(state);
  });

  it('treats a long rotation drag as one undo step and preserves earlier adjustments', () => {
    let state = atelierReducer(createHistory(), { type: 'patch', patch: { glaze: 'moss' } });
    for (let i = 0; i < 180; i++) state = atelierReducer(state, { type: 'rotate', delta: .65, transient: true });
    expect(state.past).toHaveLength(1);
    state = atelierReducer(state, { type: 'commit' });
    expect(state.past).toHaveLength(2);
    state = atelierReducer(state, { type: 'undo' });
    expect(state.present.rotation).toBe(DEFAULT_DESIGN.rotation);
    expect(state.present.glaze).toBe('moss');
    expect(atelierReducer(state, { type: 'undo' }).present).toEqual(DEFAULT_DESIGN);
  });

  it('caps undo memory and safely tolerates repeated undo', () => {
    let state = createHistory();
    for (let i = 0; i < 100; i++) state = atelierReducer(state, { type: 'rotate', delta: 15 });
    expect(state.past).toHaveLength(HISTORY_LIMIT);
    for (let i = 0; i < 100; i++) state = atelierReducer(state, { type: 'undo' });
    expect(state.past).toHaveLength(0);
    expect(Number.isFinite(state.present.rotation)).toBe(true);
    expect(atelierReducer(state, { type: 'undo' })).toBe(state);
  });

  it('does not mutate state passed to reducer', () => {
    const original = createHistory();
    const snapshot = JSON.stringify(original);
    atelierReducer(original, { type: 'patch', patch: { height: 120 } });
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});
