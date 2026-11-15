/**
 * CHARACTERIZATION TESTS — editScoreHelpers.ts
 *
 * Propósito: Capturar comportamento OBSERVADO dos helpers de edição de placar
 * Data: 2026-08-18
 * Owner: @qa
 *
 * Comportamentos suspeitos (resolvidos):
 * - TD-046: getNextServerAfterSet e isMatchTiebreakSetUtil não duplicam (auditoria concluída)
 * - validateSetResult valida corretamente scores por formato (7-5, tiebreak, PRO_SET, etc.)
 * - validateMatchTiebreak aceita até 30 pontos (flexível para edits parciais — design intencional)
 * - totalSetsForFormat retorna 1 para formato desconhecido (fallback seguro)
 * - TD-046: Separação primitivos (editScoreHelpers) vs orquestração (edit-score-state) está correta
 *
 * Kit compartilhado pelas suítes editScoreHelpers.characterization.*.test.ts.
 * Fora da coleta do Jest (nao termina em .test.ts).
 */
import { getNextServerAfterSet } from '@/core/scoring/edit-score-domain';
import type { TennisFormat } from '@/core/scoring/types';

type NextServerParams = Parameters<typeof getNextServerAfterSet>[0];

/** Arrange base dos testes de getNextServerAfterSet (idêntico ao original). */
export const baseParams = {
  currentServer: 'player1' as const,
  p1Games: 6,
  p2Games: 4,
  format: 'BEST_OF_3' as TennisFormat,
  completedSets: [] as Array<{ player1: number; player2: number }>,
};

/** getNextServerAfterSet com baseParams do original + overrides (Arrange delegado). */
export function nextServer(overrides: Partial<NextServerParams> = {}) {
  return getNextServerAfterSet({ ...baseParams, ...overrides } as NextServerParams);
}
