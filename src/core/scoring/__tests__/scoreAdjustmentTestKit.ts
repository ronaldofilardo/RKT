/**
 * Kit de testes de score-adjustment-mt-formats.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra o arrange do arquivo original (assercoes 1:1 mantidas nos testes):
 * - makeConfig(): config com ids p1/p2 (formato como any, igual ao original);
 * - setResult(): linha de SetEditData (jogos + parcial + tiebreak opcional);
 * - setScore(): placar de set em uma linha;
 * - finishedState(): ScoringState de partida encerrada (currentGame zerado,
 *   startedAt = Date.now(), igual aos literals engine:* do original).
 */
import type { ScoringState, SetScore } from '@/core/scoring/types';
import type { SetEditData } from '@/core/scoring/edit-score-domain';

export function makeConfig(format: string) {
  return {
    format: format as any,
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
  };
}

/**
 * Linha de SetEditData. Sem tiebreakScore informado, a chave e OMITIDA (igual
 * aos literais do original — nao basta passar undefined).
 */
export function setResult(
  p1Games: number,
  p2Games: number,
  isPartial = false,
  tiebreakScore?: { player1: number; player2: number }
): SetEditData {
  return tiebreakScore ? { p1Games, p2Games, isPartial, tiebreakScore } : { p1Games, p2Games, isPartial };
}

/** SetScore em uma linha (tiebreakScore: null por default). */
export function setScore(
  player1: number,
  player2: number,
  isTiebreak = false,
  tiebreakScore?: { player1: number; player2: number }
): SetScore {
  return { player1, player2, isTiebreak, tiebreakScore: tiebreakScore ?? null };
}

/** ScoringState de partida ja finalizada, usado nos testes "engine: ...". */
export function finishedState(
  sets: SetScore[],
  setsWon: { player1: number; player2: number },
  server: 'player1' | 'player2',
  winner: 'player1' | 'player2'
): ScoringState {
  return {
    sets,
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server,
    isFinished: true,
    winner,
    setsWon,
    startedAt: Date.now(),
    secondServe: false,
  };
}
