/**
 * Regressão (2026-09-02): BEST_OF_5, 4º set.
 *
 * Reportado: ao editar o placar, o sistema aceitava (habilitava o botão
 * "Confirmar") um resultado de set inválido como 7x0 — que em um formato
 * com tiebreak (vence em 6 com diferença de 2, ou 7-5, ou 7-6 via TB)
 * jamais poderia acontecer, já que o set teria fechado em 6x0.
 *
 * Causa raiz: `validateStandardSet` retorna, no ramo de erro genérico
 * ("Invalid set score"), um objeto SEM o campo `hasTiebreak` definido.
 * Em `canConfirm` (use-edit-score-calculator.ts), o fallback
 * `validation.hasTiebreak ?? false` virava `false`, disparando o
 * early-return `if (!hasTiebreak) return true` e ignorando por completo
 * o erro de validação (`setValidationError`).
 *
 * Este teste usa as funções reais de `edit-score-logic.ts` (não uma
 * reimplementação) para não perder sincronia com o código de produção,
 * espelhando apenas a árvore de decisão de `canConfirm`.
 */
import {
  calculateValidation,
  calculateMatchState,
  calculateTiebreakValidation,
} from '../edit-score-logic';
import type { CompletedSet } from '../edit-score-logic';

function computeCanConfirm(
  p1Input: string,
  p2Input: string,
  completedSets: CompletedSet[],
) {
  const validation = calculateValidation({
    p1Input,
    p2Input,
    matchFormat: 'BEST_OF_5',
    totalEditedSets: completedSets.length,
    tiebreakP1: '',
    tiebreakP2: '',
  });
  const matchState = calculateMatchState({
    matchFormat: 'BEST_OF_5',
    completedSets,
    newSets: [],
    validation,
  });
  const tiebreakValidation = calculateTiebreakValidation(
    '',
    '',
    validation.hasTiebreak || !!validation.setValidation?.tiebreakRequired,
  );

  const bothFilled = validation.bothFilled;
  const isMatchTiebreakSet = matchState.isMatchTiebreakSet;
  const hasTiebreak = validation.hasTiebreak;
  const setValidationError = validation.setValidationError;
  const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;

  if (!bothFilled) return false;
  if (isMatchTiebreakSet) return !setValidationError || validation.isSetTrulyCompleted;
  if (setValidationError && !tiebreakRequired) return false;
  if (!hasTiebreak) return true;
  if (!tiebreakRequired) return true;
  return tiebreakValidation.hasValidTiebreak;
}

// 3 sets já concluídos: 6x0, 0x6, 6x0 (setsWon 2x1) — próximo é o 4º set.
const priorSets: CompletedSet[] = [
  { games: { player1: 6, player2: 0 }, winner: 'player1' },
  { games: { player1: 0, player2: 6 }, winner: 'player2' },
  { games: { player1: 6, player2: 0 }, winner: 'player1' },
];

describe('BEST_OF_5 — 4º set: canConfirm não deve aceitar placar inválido (bug 2026-09-02)', () => {
  it('7x0 no 4º set deve ficar com Confirmar desabilitado (placar impossível em formato com tiebreak)', () => {
    expect(computeCanConfirm('7', '0', priorSets)).toBe(false);
  });

  it('7x5 no 4º set deve ficar com Confirmar habilitado (resultado válido)', () => {
    expect(computeCanConfirm('7', '5', priorSets)).toBe(true);
  });

  it('6x0 no 4º set (vitória limpa) continua habilitado', () => {
    expect(computeCanConfirm('6', '0', priorSets)).toBe(true);
  });

  it('8x6 no 4º set (acima do máximo de 7) deve ficar desabilitado', () => {
    expect(computeCanConfirm('8', '6', priorSets)).toBe(false);
  });

  it('6x6 no 4º set sem TB informado continua habilitado (0x0 implícito, ver fix anterior)', () => {
    expect(computeCanConfirm('6', '6', priorSets)).toBe(true);
  });
});
