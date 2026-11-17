/**
 * Kit de testes de timeline-utils (timeline.logic).
 *
 * Concentra o arrange das suites `timeline-utils.*.test.ts`:
 * - createHistoryEntry()/hist(): builders de HistoryEntry com defaults do arquivo original
 *   (point + stateBefore prontos para `enrichPointsFromHistory`);
 * - FILTER_POINTS/COUNT_POINTS: fixtures dos testes de filtro e contagem;
 * - VALID_RALLY_DETAILS/COMPLETE_RALLY_DETAILS: fixtures dos testes de validação e formatação.
 *
 * Os testes mantêm asserções 1:1 com o arquivo original; apenas o arrange é delegado aqui.
 * Fora da coleta do Jest (excluído por collectCoverageFrom) e não limitado a 80L.
 */
import type { HistoryEntry, PointDetails, ScoringState } from '@/core/scoring/types';

export const player1Id = 'player-1';
export const player2Id = 'player-2';

export function createHistoryEntry(
  point: Partial<PointDetails>,
  stateBefore: Partial<ScoringState>
): HistoryEntry {
  const defaultPoint: PointDetails = {
    winnerId: player1Id,
    type: 'WINNER',
    isFirstServe: true,
    isSecondServe: false,
    isLet: false,
    serverId: player1Id,
    timestamp: Date.now(),
    rallyLength: 5,
  };

  const defaultState: ScoringState = {
    sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
  };

  return {
    point: { ...defaultPoint, ...point },
    stateBefore: { ...defaultState, ...stateBefore },
  };
}

/** Array unitário pronto para `enrichPointsFromHistory` (arrange enxuto dos testes). */
export function hist(
  point: Partial<PointDetails>,
  stateBefore: Partial<ScoringState> = {}
): HistoryEntry[] {
  return [createHistoryEntry(point, stateBefore)];
}

/** Fixture dos testes de `filterTimelinePoints`. */
export const FILTER_POINTS = [
  { winner: 'PLAYER_1' as const, type: 'WINNER' as const, isBreakPoint: true, pointNumber: 1 },
  { winner: 'PLAYER_1' as const, type: 'ACE' as const, isBreakPoint: false, pointNumber: 2 },
  { winner: 'PLAYER_2' as const, type: 'UNFORCED_ERROR' as const, isBreakPoint: false, pointNumber: 3 },
  { winner: 'PLAYER_2' as const, type: 'DOUBLE_FAULT' as const, isBreakPoint: true, pointNumber: 4 },
] as any;

/** Fixture dos testes de `countByFilter`. */
export const COUNT_POINTS = [
  { winner: 'PLAYER_1' as const, type: 'WINNER' as const, isBreakPoint: true },
  { winner: 'PLAYER_1' as const, type: 'ACE' as const, isBreakPoint: false },
  { winner: 'PLAYER_2' as const, type: 'WINNER' as const, isBreakPoint: false },
  { winner: 'PLAYER_2' as const, type: 'DOUBLE_FAULT' as const, isBreakPoint: true },
] as any;

/** RallyDetails mínimo válido (fixture dos testes de validação). */
export const VALID_RALLY_DETAILS = {
  vencedor: 'sacador' as const,
  situacao: 'fundo' as const,
  tipo: 'winner' as const,
  golpe: 'fh' as const,
  previewBalls: 3,
};

/** RallyDetails completo (fixture dos testes de formatação). */
export const COMPLETE_RALLY_DETAILS = {
  vencedor: 'sacador' as const,
  situacao: 'fundo' as const,
  tipo: 'winner' as const,
  golpe: 'fh' as const,
  efeito: 'topspin' as const,
  direcao: 'cruzada' as const,
  golpe_esp: 'lob' as const,
  subtipo1: 'passing_shot' as const,
  subtipo2: 'out' as const,
  previewBalls: 5,
};
