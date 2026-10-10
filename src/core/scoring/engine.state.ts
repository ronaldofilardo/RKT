import type { ScoringEngineConfig, ScoringState, GameScore, HistoryEntry } from './types';
import { getInitialGames, createEmptySetForFormat } from './format-rules';

export function createInitialState(config: ScoringEngineConfig): ScoringState {
  const server = config.initialServerId === config.player1Id ? 'player1' : 'player2';
  return {
    // Formatos com placar inicial (Sets Curtos 2/2) já nascem com o set 1 em 2-2,
    // igual ao scoreState criado em matchService (buildCreateDefaults).
    sets: getInitialGames(config.format) > 0 ? [createEmptySetForFormat(config.format)] : [],
    currentGame: {
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
      secondServe: false,
    },
    server,
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };
}



export function createEmptyGame(): GameScore {
  return { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false };
}

export function getState(state: ScoringState): Readonly<ScoringState> {
  return JSON.parse(JSON.stringify(state));
}

export function serialize(state: ScoringState, history: HistoryEntry[]): string {
  return JSON.stringify({ state, history });
}

export function fromSerialized(
  _config: ScoringEngineConfig,
  serialized: string,
  setState: (state: ScoringState) => void,
  restoreHistory: (history: HistoryEntry[]) => void,
): { state: ScoringState; history: HistoryEntry[] } {
  const parsed = JSON.parse(serialized);
  let state: ScoringState;
  let history: HistoryEntry[] = [];
  if (parsed.state && Array.isArray(parsed.history)) {
    state = parsed.state as ScoringState;
    history = parsed.history as HistoryEntry[];
  } else {
    state = parsed as ScoringState;
  }
  setState(state);
  if (history.length > 0) restoreHistory(history);
  return { state, history };
}

export function reconcileWithCanonicalState(
  _state: ScoringState,
  history: HistoryEntry[],
  canonicalState: ScoringState,
  canonicalVersion: number,
): { state: ScoringState; history: HistoryEntry[] } {
  const newState = JSON.parse(JSON.stringify(canonicalState));
  const newHistory = canonicalVersion < history.length
    ? history.slice(0, canonicalVersion)
    : history;
  return { state: newState, history: newHistory };
}