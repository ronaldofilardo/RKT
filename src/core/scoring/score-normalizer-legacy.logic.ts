import type { TennisFormat } from './types';
import { extractHistory, reconstructTiebreakFromHistory } from './score-normalizer-history.logic';

export function normalizeRegularTiebreakSets(sets: Record<string, unknown>[], rawScoreState: unknown): Record<string, unknown>[] {
  const history = extractHistory(rawScoreState);
  return sets.map((set: Record<string, unknown>, idx: number) => {
    if (!set || set.tiebreakScore != null) return set;
    const is76 = set.player1 === 7 && set.player2 === 6;
    const is67 = set.player1 === 6 && set.player2 === 7;
    if (!is76 && !is67) return set;
    const reconstructed = reconstructTiebreakFromHistory(history, idx);
    return reconstructed ? { ...set, tiebreakScore: reconstructed } : set;
  });
}

/**
 * Legado — Sets Curtos 2/2: versões antigas do motor empilhavam o placar
 * inicial 2-2 como se fosse um set (ex.: [2-2, 4-2, 4-2]). Um set 2-2 sem
 * tiebreak que NÃO é o último item do array nunca é um set real (um set
 * concluído não termina em 2-2), então é descartado para que a posição de
 * cada set volte a bater com o número do set.
 */
export function stripLegacyInitialPlaceholder(
  sets: Record<string, unknown>[],
  format?: TennisFormat,
): Record<string, unknown>[] {
  if (format !== 'SHORT_SET_2V2_NO_AD' || sets.length < 2) return sets;
  const first = sets[0];
  const isPlaceholder =
    first &&
    first.player1 === 2 &&
    first.player2 === 2 &&
    !first.isTiebreak &&
    first.tiebreakScore == null;
  return isPlaceholder ? sets.slice(1) : sets;
}
