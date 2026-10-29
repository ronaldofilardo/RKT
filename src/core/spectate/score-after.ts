import { formatSpectatorGame, type RawGameState } from './game-display';

export interface ScoreAfterTimelinePoint {
  setNumber: number;
  gamesScore: { player1: number; player2: number };
  gameScore: { player1: number; player2: number };
  gameIsDeuce?: boolean;
  gameAdvantage?: 'player1' | 'player2' | null;
  isTiebreak?: boolean;
}

function sameGame(a: ScoreAfterTimelinePoint, b: ScoreAfterTimelinePoint): boolean {
  return (
    a.setNumber === b.setNumber &&
    a.gamesScore.player1 === b.gamesScore.player1 &&
    a.gamesScore.player2 === b.gamesScore.player2
  );
}

function label(p: ScoreAfterTimelinePoint): string {
  const raw: RawGameState = {
    player1: p.gameScore.player1,
    player2: p.gameScore.player2,
    isDeuce: p.gameIsDeuce,
    advantage: p.gameAdvantage ?? null,
  };
  const g = formatSpectatorGame(raw, p.isTiebreak ? p.gameScore : null);
  return `${g.player1}-${g.player2}`;
}

/**
 * Placar do game DEPOIS de cada ponto. O placar de um ponto é o placar "antes"
 * do ponto seguinte; se o game (ou set) virou, mostra o resultado em games.
 * Para o último ponto usa o placar atual da partida.
 */
export function computeScoreAfterLabels(
  timeline: ScoreAfterTimelinePoint[],
  finalGame: { player1: string; player2: string },
): string[] {
  return timeline.map((cur, i) => {
    const next = timeline[i + 1];
    if (next) {
      if (sameGame(cur, next)) return label(next);
      return next.setNumber === cur.setNumber
        ? `Game ${next.gamesScore.player1}-${next.gamesScore.player2}`
        : 'Fim do set';
    }
    if (finalGame.player1 === '0' && finalGame.player2 === '0') return 'Game';
    return `${finalGame.player1}-${finalGame.player2}`;
  });
}
