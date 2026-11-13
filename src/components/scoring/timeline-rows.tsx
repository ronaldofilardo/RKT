// Renderização das linhas de fim de game e de entrada/saída do tiebreak na timeline do report.
import type { TimelinePoint } from '@/core/scoring/types';
import type { TimelineDoublesConfig } from './timeline-row.logic';
import { SetHeaderRow } from './timeline-set-group-banner';
import { SetGroupPoints } from './timeline-set-group-points';

// Re-exports de compatibilidade (módulo movido para ./timeline-point-row).
export { PointRow } from './timeline-point-row';
// Re-exports de compatibilidade (helpers movidos para ./timeline-row.logic).
export { getPlayerInitials } from './timeline-row.logic';

interface SetGroupProps {
  setNumber: number;
  points: TimelinePoint[];
  allPoints: TimelinePoint[];
  hasActiveFilters: boolean;
  isLast: boolean;
  matchId: string;
  player1Name: string;
  player2Name: string;
  doubles?: TimelineDoublesConfig;
  isMatchTb?: boolean;
  /** Bug 7 — games iniciais do set (2 para SHORT_SET_2V2_NO_AD, 0 para os demais). */
  initialGames?: number;
}

export function SetGroup({
  setNumber: _setNumber,
  points,
  hasActiveFilters,
  isLast,
  matchId,
  player1Name,
  player2Name,
  doubles,
  isMatchTb,
  initialGames = 0,
}: SetGroupProps) {
  const colSpan = isMatchTb ? 24 : 25;

  return (
    <>
      {!hasActiveFilters && (
        <SetHeaderRow colSpan={colSpan} setNumber={_setNumber} isMatchTb={isMatchTb} />
      )}
      <SetGroupPoints
        points={points}
        hasActiveFilters={hasActiveFilters}
        isMatchTb={isMatchTb}
        isLast={isLast}
        matchId={matchId}
        player1Name={player1Name}
        player2Name={player2Name}
        doubles={doubles}
        initialGames={initialGames}
        colSpan={colSpan}
      />
    </>
  );
}
