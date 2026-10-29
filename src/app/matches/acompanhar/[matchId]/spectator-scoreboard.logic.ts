import type { SpectatorView } from '@/core/spectate';
import type { ScoreboardCardProps, ScoreboardSet } from '@/components/scoring/scoreboard-card.types';
import { abbreviateDoublesName } from '@/components/scoring/doubles-name-abbreviation.logic';

function deriveWinner(sets: ScoreboardSet[]): 'player1' | 'player2' | null {
  let p1 = 0;
  let p2 = 0;
  for (const s of sets) {
    const isMatchTb = s.tiebreakScore && s.player1 <= 1 && s.player2 <= 1;
    const a = isMatchTb ? s.tiebreakScore!.player1 : s.player1;
    const b = isMatchTb ? s.tiebreakScore!.player2 : s.player2;
    if (a > b) p1++;
    else if (b > a) p2++;
  }
  if (p1 === p2) return null;
  return p1 > p2 ? 'player1' : 'player2';
}

/**
 * Adapta a SpectatorView (lista-branca) às props do ScoreboardCard do /scoring,
 * para o acompanhamento exibir exatamente o mesmo padrão de placar.
 */
export function buildSpectatorScoreboardProps(view: SpectatorView): ScoreboardCardProps {
  const { match, score } = view;
  const [side1, side2] = match.sides;
  const isFinished = match.state === 'FINISHED';

  const sets: ScoreboardSet[] = (score.sets.length > 0 ? score.sets : [{ player1: 0, player2: 0, tiebreak: null }]).map((s) => ({
    player1: s.player1,
    player2: s.player2,
    isTiebreak: Boolean(s.tiebreak),
    tiebreakScore: s.tiebreak ?? null,
  }));

  const m1 = side1.members[0];
  const m1b = side1.members[1];
  const m2 = side2.members[0];
  const m2b = side2.members[1];

  return {
    player1: { id: m1?.id ?? 'side1', name: m1?.name ?? side1.label },
    player2: { id: m2?.id ?? 'side2', name: m2?.name ?? side2.label },
    player1Partner: m1b ? { id: m1b.id, name: m1b.name } : null,
    player2Partner: m2b ? { id: m2b.id, name: m2b.name } : null,
    displayNames: {
      player1: m1 ? abbreviateDoublesName(m1.name, m1b?.name) : side1.label,
      player2: m2 ? abbreviateDoublesName(m2.name, m2b?.name) : side2.label,
    },
    format: match.format,
    scoreState: {
      sets,
      isFinished,
      winner: isFinished ? deriveWinner(sets) : null,
      server: score.serverSide === 'side1' ? 'player1' : score.serverSide === 'side2' ? 'player2' : null,
    },
    gamePoints: isFinished
      ? null
      : { player1: score.currentGame.player1, player2: score.currentGame.player2, title: score.isTiebreak ? 'TB' : 'Pts' },
    className: 'w-full',
  };
}
