/**
 * Estado puro das janelas flutuantes de acompanhamento (popup do gestor).
 * Até MAX_FLOATING_SPECTATORS partidas abertas ao mesmo tempo.
 */
export const MAX_FLOATING_SPECTATORS = 3;

export interface FloatingSpectatorItem {
  matchId: string;
  title: string;
  minimized: boolean;
}

export interface FloatingSpectatorState {
  items: FloatingSpectatorItem[];
  focusedId: string | null;
  limitReached: boolean;
}

export type FloatingSpectatorAction =
  | { type: 'OPEN'; matchId: string; title?: string }
  | { type: 'CLOSE'; matchId: string }
  | { type: 'TOGGLE_MINIMIZE'; matchId: string }
  | { type: 'FOCUS'; matchId: string }
  | { type: 'DISMISS_LIMIT' };

export const initialFloatingSpectatorState: FloatingSpectatorState = {
  items: [],
  focusedId: null,
  limitReached: false,
};

export function floatingSpectatorReducer(
  state: FloatingSpectatorState,
  action: FloatingSpectatorAction,
): FloatingSpectatorState {
  switch (action.type) {
    case 'OPEN': {
      const exists = state.items.some((i) => i.matchId === action.matchId);
      if (exists) {
        return {
          items: state.items.map((i) => (i.matchId === action.matchId ? { ...i, minimized: false } : i)),
          focusedId: action.matchId,
          limitReached: false,
        };
      }
      if (state.items.length >= MAX_FLOATING_SPECTATORS) return { ...state, limitReached: true };
      const item: FloatingSpectatorItem = {
        matchId: action.matchId,
        title: action.title ?? 'Partida',
        minimized: false,
      };
      return { items: [...state.items, item], focusedId: action.matchId, limitReached: false };
    }
    case 'CLOSE': {
      const items = state.items.filter((i) => i.matchId !== action.matchId);
      const focusedId = state.focusedId === action.matchId ? (items[items.length - 1]?.matchId ?? null) : state.focusedId;
      return { ...state, items, focusedId, limitReached: false };
    }
    case 'TOGGLE_MINIMIZE': {
      const target = state.items.find((i) => i.matchId === action.matchId);
      if (!target) return state;
      return {
        ...state,
        items: state.items.map((i) => (i.matchId === action.matchId ? { ...i, minimized: !i.minimized } : i)),
        focusedId: target.minimized ? action.matchId : state.focusedId,
      };
    }
    case 'FOCUS':
      return state.items.some((i) => i.matchId === action.matchId) ? { ...state, focusedId: action.matchId } : state;
    case 'DISMISS_LIMIT':
      return state.limitReached ? { ...state, limitReached: false } : state;
    default:
      return state;
  }
}
