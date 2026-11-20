import type { ScoringEngineConfig, ScoringState, HistoryEntry } from './types';
import { sideOfPlayer } from './doubles-members';
import { applyGameServerChange } from './game-server-change.logic';

/**
 * Lado do sacador inicial, cônscio de duplas (titular ou parceiro).
 * Fallback simples mantém o comportamento legado para partidas de simples.
 */
export function initialServerSide(config: ScoringEngineConfig): 'player1' | 'player2' {
  if (config.doubles) {
    const side = sideOfPlayer(config.doubles, config.initialServerId);
    if (side) return side;
  }
  return config.initialServerId === config.player2Id ? 'player2' : 'player1';
}

/**
 * Janela em que `correctInitialServer` reescreve `state.server` a partir do
 * `initialServerId`: game 1 do 1º set (0 games concluídos, sem pontos de
 * tiebreak). Correções de sacador feitas nessa janela devem também sincronizar
 * o `initialServerId` persistido, senão a reidratação desfaz a troca.
 */
export function isInitialServerCorrectionWindow(
  state: ScoringState,
  config: ScoringEngineConfig,
): boolean {
  const totalCompletedGames = (state.sets ?? []).reduce(
    (acc, s) => acc + (s.player1 || 0) + (s.player2 || 0),
    0,
  );
  const hasTiebreakPoints = (state.sets ?? []).some(
    (s) => s.tiebreakScore && (s.tiebreakScore.player1 > 0 || s.tiebreakScore.player2 > 0),
  );
  return config.format !== 'MATCH_TB_10' && totalCompletedGames === 0 && !hasTiebreakPoints;
}

/**
 * Normaliza o `server` de payloads legados: dados antigos gravavam o userId
 * cru no lugar de 'player1' | 'player2'.
 */
function normalizeServer(state: ScoringState, config: ScoringEngineConfig): void {
  // `state.server` é tipado como 'player1' | 'player2', mas dados legados
  // gravavam o userId cru. Alarga para string apenas para a comparação.
  const rawServer = state.server as string;
  if (config.doubles) {
    const side = sideOfPlayer(config.doubles, rawServer);
    if (side) {
      state.server = side;
      return;
    }
  }
  if (rawServer === config.player2Id) {
    state.server = 'player2';
  } else if (rawServer === config.player1Id) {
    state.server = 'player1';
  } else if (rawServer !== 'player1' && rawServer !== 'player2') {
    state.server = initialServerSide(config);
  }
}

/**
 * Corrige o saque inicial para estados "virgens" ou do game 1 quando o
 * canônico diverge (ex.: reconstrução de sessão suspensa).
 */
function correctInitialServer(state: ScoringState, config: ScoringEngineConfig, history: HistoryEntry[]): void {
  const hasCurrentGamePoints = Boolean(
    state.currentGame && (
      state.currentGame.player1 > 0 ||
      state.currentGame.player2 > 0 ||
      Boolean(state.currentGame.advantage) ||
      state.currentGame.secondServe
    )
  );
  const isGame1 = isInitialServerCorrectionWindow(state, config);
  const isZeroScore = isGame1 && !hasCurrentGamePoints && history.length === 0;

  if (isZeroScore && config.initialServerId) {
    state.server = initialServerSide(config);
    if (config.doubles && state.doubles) {
      try {
        applyGameServerChange(state, config, config.initialServerId);
      } catch {
        // Fallback resiliente
      }
    }
  } else if (isGame1 && initialServerSide(config) === 'player2' && state.server === 'player1') {
    state.server = 'player2';
  } else if (isGame1 && initialServerSide(config) === 'player1' && state.server === 'player2') {
    state.server = 'player1';
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
