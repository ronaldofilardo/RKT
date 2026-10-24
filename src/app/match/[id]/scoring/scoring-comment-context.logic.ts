import type { ScoringState } from '@/core/scoring/types';

function formatGameLabel(game: NonNullable<ScoringState['currentGame']>): [string, string] {
  if (game.isDeuce) {
    const p1 = game.advantage === 'player1' ? 'AD' : '40';
    const p2 = game.advantage === 'player2' ? 'AD' : '40';
    return [p1, p2];
  }
  const map = [0, 15, 30, 40];
  return [String(map[game.player1] ?? game.player1), String(map[game.player2] ?? game.player2)];
}

export function buildCommentContextPrefix(
  engineState: ScoringState | undefined,
  pointNumber: number,
): string {
  if (!engineState || engineState.sets.length === 0) return '';

  const game = engineState.currentGame;
  const currentSet = engineState.sets[engineState.sets.length - 1];
  const isTiebreak = currentSet?.isTiebreak;

  let p1Score = '0';
  let p2Score = '0';

  if (isTiebreak && currentSet.tiebreakScore) {
    p1Score = String(currentSet.tiebreakScore.player1);
    p2Score = String(currentSet.tiebreakScore.player2);
  } else {
    [p1Score, p2Score] = formatGameLabel(game);
  }

  const gamesP1 = currentSet.player1;
  const gamesP2 = currentSet.player2;
  const setNumber = engineState.sets.length;

  return `[Set ${setNumber} · Game ${gamesP1}x${gamesP2} · Pt ${pointNumber} (${p1Score}x${p2Score})] `;
}
