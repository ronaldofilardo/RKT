'use client';

import type { TimelinePoint } from '@/core/scoring/types';
import { SetGroup } from './timeline-rows';
import { TimelineTableHead } from './timeline-table-head';
import { getSetResults } from './timeline-set-results';

interface TimelineTableProps {
  groupedBySet: { setNumber: number; points: TimelinePoint[] }[];
  points: TimelinePoint[];
  hasActiveFilters: boolean;
  filteredCount: number;
  matchId: string;
  player1Name: string;
  player2Name: string;
  showFinalResult?: boolean;
  scoreState?: unknown;
}

export function TimelineTable({
  groupedBySet,
  points,
  hasActiveFilters,
  filteredCount,
  matchId,
  player1Name,
  player2Name,
  showFinalResult,
  scoreState,
}: TimelineTableProps) {
  return (
    <div className="overflow-hidden border border-white/10 rounded-lg">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <table className="w-full text-[11px]" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <TimelineTableHead />
            <tbody className="bg-transparent">
              {hasActiveFilters && filteredCount === 0 && (
                <tr><td colSpan={25} className="text-center py-6 text-telemetry-text-muted text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
              )}
              {groupedBySet.map((group, gi) => (
                <SetGroup
                  key={group.setNumber}
                  setNumber={group.setNumber}
                  points={group.points}
                  allPoints={points}
                  hasActiveFilters={hasActiveFilters}
                  isLast={gi === groupedBySet.length - 1}
                  matchId={matchId}
                  player1Name={player1Name}
                  player2Name={player2Name}
                />
              ))}
              {showFinalResult && <FinalResultRow points={points} scoreState={scoreState} />}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FinalResultRow({ points, scoreState }: { points: TimelinePoint[]; scoreState?: unknown }) {
  const setResults = getSetResults(points, scoreState);
  return (
    <tr className="bg-telemetry-elevated border-t border-white/10 font-bold">
      <td colSpan={3} className="px-1.5 py-2 text-[10px] text-telemetry-text-primary sticky left-0 bg-telemetry-elevated z-10 border-r border-white/10 text-right pr-3">
        Resultado
      </td>
      <td colSpan={2} className="px-1.5 py-2 text-[10px] border-r border-white/10">
        <div className="flex flex-col leading-tight">
          {setResults.map((sr) => (
            <span key={sr.setNumber} className="text-telemetry-text-primary">
              {sr.p1}x{sr.p2}
              {sr.tiebreak ? ` (${sr.tiebreak.p1}x${sr.tiebreak.p2})` : ''}
            </span>
          ))}
        </div>
      </td>
      <td colSpan={20} aria-hidden="true" />
    </tr>
  );
}
