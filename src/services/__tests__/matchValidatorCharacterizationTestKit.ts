/**
 * CHARACTERIZATION TESTS — matchValidator.ts
 *
 * Kit de testes de matchValidator.characterization.test.ts (não é .test.ts:
 * fica fora da coleta do Jest e não é limitado a 80L). Concentra o arrange:
 * - baseMatch()/matchWith(): linha base de partida com overrides;
 * - finishedScoreState(): scoreState completo de partida encerrada (mesmo
 *   literal repetido nos testes de finish/transition);
 * - scoreState()/game()/setScore()/tbSet(): builders dos pares old/new.
 *
 * Propósito: Capturar comportamento OBSERVADO das validações de match
 * Data: 2026-07-20
 * Owner: @qa
 *
 * Comportamentos suspeitos (resolvidos):
 * - TD-036: validateFinishMatch exige winnerId válido para reason=COMPLETED
 * - TD-036: validateTransitionState bloqueia SCHEDULED→FINISHED via ALLOWED_TRANSITIONS
 * - Score regression detection funciona corretamente em tiebreak (testes validam)
 */

export const baseMatch = {
  format: 'BEST_OF_3',
  player1Id: 'player-1',
  player2Id: 'player-2',
  initialServerId: 'player-1',
  scoreState: null,
  state: 'SCHEDULED' as const,
};

/** baseMatch com overrides. */
export function matchWith(overrides: Record<string, unknown> = {}) {
  return { ...baseMatch, ...overrides };
}

/** scoreState de partida encerrada (overrides sobrescrevem os defaults). */
export function finishedScoreState(overrides: Record<string, unknown> = {}) {
  return {
    sets: [{ player1: 6, player2: 4 }, { player1: 6, player2: 4 }],
    setsWon: { player1: 2, player2: 0 },
    isFinished: true,
    winner: 'player1',
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    startedAt: null,
    secondServe: false,
    ...overrides,
  };
}

/** scoreState parcial { sets, setsWon, ...extras } (testes de regressão). */
export function scoreState(sets: unknown[], setsWon: Record<string, number>, extras: Record<string, unknown> = {}) {
  return { sets, setsWon, ...extras };
}

/** currentGame { player1, player2, isDeuce, ...extras }. */
export function game(player1: number, player2: number, extras: Record<string, unknown> = {}) {
  return { player1, player2, isDeuce: false, ...extras };
}

/** set { player1, player2 } (testes de getGamePointCount/isTiebreakRegressing). */
export function setScore(player1: number, player2: number) {
  return { player1, player2 };
}

/** set em tiebreak com tiebreakScore informado. */
export function tbSet(p1: number, p2: number) {
  return { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: p1, player2: p2 } };
}
