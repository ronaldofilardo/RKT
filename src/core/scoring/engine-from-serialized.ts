import type { ScoringEngineConfig, ScoringState, HistoryEntry } from './types';

/**
 * Normaliza o `server` de payloads legados: dados antigos gravavam o userId
 * cru no lugar de 'player1' | 'player2'.
 */
function normalizeServer(state: ScoringState, config: ScoringEngineConfig): void {
  // `state.server` é tipado como 'player1' | 'player2', mas dados legados
  // gravavam o userId cru. Alarga para string apenas para a comparação.
  const rawServer = state.server as string;
  if (rawServer === config.player2Id) {
    state.server = 'player2';
  } else if (rawServer === config.player1Id) {
    state.server = 'player1';
  } else if (rawServer !== 'player1' && rawServer !== 'player2') {
    state.server = config.initialServerId === config.player2Id ? 'player2' : 'player1';
  }
}

/**
 * Corrige o saque inicial para estados "virgens" ou do game 1 quando o
 * canônico diverge (ex.: reconstrução de sessão suspensa).
 */
function correctInitialServer(state: ScoringState, config: ScoringEngineConfig, history: HistoryEntry[]): void {
  const totalCompletedGames = (state.sets ?? []).reduce(
    (acc, s) => acc + (s.player1 || 0) + (s.player2 || 0),
    0
  );
  const hasCurrentGamePoints = Boolean(
    state.currentGame && (
      state.currentGame.player1 > 0 ||
      state.currentGame.player2 > 0 ||
      Boolean(state.currentGame.advantage) ||
      state.currentGame.secondServe
    )
  );
  const hasTiebreakPoints = Boolean(
    (state.sets ?? []).some(
      (s) => s.tiebreakScore && (s.tiebreakScore.player1 > 0 || s.tiebreakScore.player2 > 0)
    )
  );
  const isVirginState =
    config.format !== 'MATCH_TB_10' &&
    totalCompletedGames === 0 &&
    !hasCurrentGamePoints &&
    !hasTiebreakPoints &&
    history.length === 0 &&
    state.startedAt == null;

  const isGame1 = config.format !== 'MATCH_TB_10' && totalCompletedGames === 0 && !hasTiebreakPoints;
  if (isGame1 && config.initialServerId === config.player2Id && state.server === 'player1') {
    state.server = 'player2';
  } else if (isVirginState && config.initialServerId) {
    state.server = config.initialServerId === config.player2Id ? 'player2' : 'player1';
  }
}

export function parseSerializedEnginePayload(
  serialized: string,
  config: ScoringEngineConfig,
): { state: ScoringState; history: HistoryEntry[] } {
  let state: ScoringState;
  let history: HistoryEntry[] = [];
  const parsed = JSON.parse(serialized);
  if (parsed.state && Array.isArray(parsed.history)) {
    state = parsed.state as ScoringState;
    history = parsed.history as HistoryEntry[];
  } else {
    state = parsed as ScoringState;
  }

  normalizeServer(state, config);
  correctInitialServer(state, config, history);

  return { state, history };
}
