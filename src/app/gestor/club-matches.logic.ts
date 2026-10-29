import { TENNIS_FORMATS } from '@/app/match/new/matchConstants';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import type { TennisFormat } from '@/core/scoring/types';
import type { SetCellScore } from '@/components/dashboard/match-card.types';
import { isMatchTiebreakFormat, isSetIndexMatchTiebreak } from '@/components/dashboard/match-card-tiebreak.logic';

/**
 * Retorna o rótulo amigável do formato de jogo conforme exibido no droplist de nova partida.
 */
export function getMatchFormatDisplayLabel(format: string): string {
  const option = TENNIS_FORMATS.find((f) => f.value === format);
  return option ? option.label : format;
}

/**
 * Formata o placar resumido de uma partida para exibição na listagem.
 * Exemplo: "6/4 3/6 6/2", "7/6(4) 6/3", "6/4 4/6 10/8" ou "—".
 */
export function formatClubMatchScore(
  rawScoreState: unknown,
  format?: string,
  state?: string,
): string {
  const normalized = normalizeScoreState(rawScoreState, format as TennisFormat);
  if (!normalized || !normalized.sets || normalized.sets.length === 0) {
    return '—';
  }

  const sets = normalized.sets;

  // Se tem apenas 1 set zerado e a partida está agendada ou sem pontos
  if (
    sets.length === 1 &&
    sets[0].player1 === 0 &&
    sets[0].player2 === 0 &&
    !sets[0].tiebreakScore &&
    state === 'SCHEDULED'
  ) {
    return '—';
  }

  const setScores = sets.map((set: SetCellScore, index: number) => {
    const isMt =
      (format && isMatchTiebreakFormat(format) && isSetIndexMatchTiebreak(sets, index, format as TennisFormat)) ||
      (set.player1 <= 1 && set.player2 <= 1 && !!set.tiebreakScore);

    // Match Tiebreak exibe os pontos do tiebreak diretamente (ex: 10/8)
    if (isMt && set.tiebreakScore) {
      return `${set.tiebreakScore.player1}/${set.tiebreakScore.player2}`;
    }

    // Set tiebreak finalizado (ex: 7/6(4))
    if (set.isTiebreak && set.tiebreakScore) {
      const isFinishedSet = Math.max(set.player1, set.player2) >= 7;
      if (isFinishedSet) {
        const loserPoints = Math.min(set.tiebreakScore.player1, set.tiebreakScore.player2);
        return `${set.player1}/${set.player2}(${loserPoints})`;
      }
      return `${set.player1}/${set.player2}(${set.tiebreakScore.player1}-${set.tiebreakScore.player2})`;
    }

    return `${set.player1}/${set.player2}`;
  });

  return setScores.join(' ');
}
