'use client';

interface LivePointsProps {
  isCurrentSetMT: boolean;
  lastSetTiebreakScore: { player1: number; player2: number } | null;
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | null;
  getSinglePointDisplay: (game: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | undefined, player: 'player1' | 'player2') => string;
  playerKey: 'player1' | 'player2';
  cellClasses: string;
}

export function LivePoints({
  isCurrentSetMT,
  lastSetTiebreakScore,
  currentGame,
  getSinglePointDisplay,
  playerKey,
  cellClasses,
}: LivePointsProps) {
  const pontos = isCurrentSetMT
    ? '-'
    : lastSetTiebreakScore
      ? String(lastSetTiebreakScore[playerKey as 'player1' | 'player2'] ?? 0)
      : getSinglePointDisplay(currentGame ?? undefined, playerKey);
  return <td className={`${cellClasses} bg-telemetry-card text-telemetry-score-accent font-bold`}>{pontos}</td>;
}