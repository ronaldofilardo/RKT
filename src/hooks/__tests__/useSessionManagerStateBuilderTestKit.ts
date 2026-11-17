/**
 * Kit de testes de useSessionManager.state-builder.test.ts (não é .test.ts:
 * fica fora da coleta do Jest e não é limitado a 80L). Concentra o arrange:
 * - setResult(): SetEditData em uma linha (extra opcional preserva a PRESENÇA
 *   da chave `tiebreakScore: undefined` quando o original a declarava, e a
 *   ausência da chave quando não declarava);
 * - buildState(): chamada única a buildNewScoringState com server: 'player1'
 *   (default de todos os testes do arquivo original).
 *
 * Contexto completo do bug "set atual" (2026-08-13), mantido aqui para não
 * repetir o bloco nos arquivos de teste: ao confirmar a edição de um placar em
 * que o ÚLTIMO set confirmado foi finalizado mas a partida ainda NÃO terminou,
 * o buildNewScoringState retornava newState.sets com o set finalizado como
 * último item do array. Como o ScoreboardCard e o motor usam
 * `sets[sets.length - 1]` como "set atual", o set finalizado acabava sendo
 * tratado como em andamento. Esperado: empurrar um set vazio no final do
 * array sempre que `!isFinished` e o último set confirmado estiver finalizado,
 * mantendo a invariante "último item = set em andamento".
 */
import { buildNewScoringState } from '../useSessionManager.state-builder';
import type { SetEditData } from '@/core/scoring/edit-score-domain';

type Format = Parameters<typeof buildNewScoringState>[0]['format'];

/** Chaves opcionais repassadas por spread (presença idêntica ao original). */
export type SetExtra = Pick<SetEditData, 'tiebreakScore' | 'currentGamePoints'>;

/** SetEditData em uma linha: { p1Games, p2Games, isPartial, ...extra }. */
export function setResult(
  p1Games: number,
  p2Games: number,
  isPartial = false,
  extra: SetExtra = {},
): SetEditData {
  return { p1Games, p2Games, isPartial, ...extra };
}

/** buildNewScoringState com server: 'player1' (default do arquivo original). */
export function buildState(setResults: SetEditData[], format: Format) {
  return buildNewScoringState({ setResults, server: 'player1', format });
}
