import { DEFAULT_DESIGN, normalizeDesign } from '../art/model';
import type { DesignState, ProfileId } from '../art/model';

export const HISTORY_LIMIT = 40;

export interface AtelierHistory {
  present: DesignState;
  past: DesignState[];
  gesture: DesignState | null;
}

export type AtelierAction =
  | { type: 'patch'; patch: Partial<DesignState>; transient?: boolean }
  | { type: 'profile'; profile: ProfileId }
  | { type: 'rotate'; delta: number; transient?: boolean }
  | { type: 'commit' }
  | { type: 'reset' }
  | { type: 'undo' };

export function createHistory(design: unknown = DEFAULT_DESIGN): AtelierHistory {
  return { present: normalizeDesign(design), past: [], gesture: null };
}

function equal(a: DesignState, b: DesignState): boolean {
  return a.profile === b.profile && a.glaze === b.glaze && a.height === b.height &&
    a.fullness === b.fullness && a.lip === b.lip && a.rotation === b.rotation;
}

function remember(past: DesignState[], design: DesignState): DesignState[] {
  return [...past.slice(-(HISTORY_LIMIT - 1)), design];
}

function commit(state: AtelierHistory): AtelierHistory {
  if (!state.gesture) return state;
  return {
    present: state.present,
    past: equal(state.present, state.gesture) ? state.past : remember(state.past, state.gesture),
    gesture: null,
  };
}

function replace(state: AtelierHistory, next: DesignState): AtelierHistory {
  const stable = commit(state);
  if (equal(stable.present, next)) return stable;
  return { present: next, past: remember(stable.past, stable.present), gesture: null };
}

/** Every shape gesture is one undo step; reset and profile selection are reversible. */
export function atelierReducer(state: AtelierHistory, action: AtelierAction): AtelierHistory {
  switch (action.type) {
    case 'patch': {
      const next = normalizeDesign({ ...state.present, ...action.patch });
      if (equal(state.present, next)) return state;
      if (action.transient) {
        return { ...state, present: next, gesture: state.gesture ?? state.present };
      }
      return replace(state, next);
    }
    case 'profile':
      return replace(state, normalizeDesign({ ...DEFAULT_DESIGN, profile: action.profile, glaze: state.present.glaze }));
    case 'rotate':
      if (!Number.isFinite(action.delta)) return state;
      return atelierReducer(state, { type: 'patch', patch: { rotation: state.present.rotation + action.delta }, transient: action.transient });
    case 'commit':
      return commit(state);
    case 'reset':
      return replace(state, normalizeDesign(DEFAULT_DESIGN));
    case 'undo': {
      if (state.gesture) return { ...state, present: state.gesture, gesture: null };
      if (!state.past.length) return state;
      return { present: state.past[state.past.length - 1], past: state.past.slice(0, -1), gesture: null };
    }
  }
}
