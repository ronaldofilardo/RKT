'use client';

import { useState, useMemo } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import {
  filterTimelinePoints,
  countByFilter,
} from './timeline-utils';
import type { FilterKey, FilterCriteria } from './timeline-types';
import { FilterBar } from './timeline-filters';
import { SetGroup } from './timeline-rows';

interface MatchTimelineViewProps {
  points: TimelinePoint[];
  player1Name: string;
  player2Name: string;
}

export function MatchTimelineView({ points, player1Name, player2Name }: MatchTimelineViewProps) {
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  const filterCriteria = useMemo(() => {
    const criteria: FilterCriteria = {};
    if (activeFilters.has('p1')) criteria.playerWinner = 'PLAYER_1';
    else if (activeFilters.has('p2')) criteria.playerWinner = 'PLAYER_2';
    if (activeFilters.has('bp')) criteria.breakPointsOnly = true;
    if (activeFilters.has('winners')) criteria.winnersOnly = true;
    if (activeFilters.has('errors')) criteria.errorsOnly = true;
    return criteria;
  }, [activeFilters]);

  const hasActiveFilters = activeFilters.size > 0;

  const filteredPoints = useMemo(
    () => hasActiveFilters ? filterTimelinePoints(points, filterCriteria) : points,
    [points, filterCriteria, hasActiveFilters],
  );

  const groupedBySet = useMemo(() => {
    const groups: { setNumber: number; points: TimelinePoint[] }[] = [];
    for (const p of filteredPoints) {
      let group = groups[groups.length - 1];
      if (!group || group.setNumber !== p.setNumber) {
        group = { setNumber: p.setNumber, points: [] };
        groups.push(group);
      }
      group.points.push(p);
    }
    return groups;
  }, [filteredPoints]);

  const counts = useMemo(() => ({
    p1: countByFilter(points, p => p.winner === 'PLAYER_1'),
    p2: countByFilter(points, p => p.winner === 'PLAYER_2'),
    bp: countByFilter(points, p => p.isBreakPoint),
    winners: countByFilter(points, p => p.type === 'WINNER' || p.type === 'ACE'),
    errors: countByFilter(points, p =>
      p.type === 'UNFORCED_ERROR' || p.type === 'FORCED_ERROR' || p.type === 'DOUBLE_FAULT'
    ),
  }), [points]);

  if (points.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Esta sessão não possui pontos detalhados registrados.
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
        counts={counts}
        playerNames={{ p1: player1Name, p2: player2Name }}
      />

      <p className="text-xs text-gray-500 mb-3">
        {hasActiveFilters
          ? `${filteredPoints.length} de ${points.length} pontos`
          : `${points.length} pontos`}
      </p>

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '7%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['SAQUE', 'GAME', 'PONTO', 'ACE / DF', 'TROCAS', 'SITUAÇÃO', 'RESULTADO', 'GOLPE', 'TIPO ERRO', 'ONDE ERROU', 'DIREÇÃO', 'EFEITO', 'ESPECIAIS'].map(h => (
                  <th key={h} className="px-1.5 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hasActiveFilters && filteredPoints.length === 0 && (
                <tr><td colSpan={13} className="text-center py-6 text-gray-400 text-xs">Nenhum ponto corresponde aos filtros selecionados.</td></tr>
              )}
              {groupedBySet.map((group, gi) => (
                <SetGroup
                  key={group.setNumber}
                  setNumber={group.setNumber}
                  points={group.points}
                  allPoints={points}
                  hasActiveFilters={hasActiveFilters}
                  player1Name={player1Name}
                  player2Name={player2Name}
                  isLast={gi === groupedBySet.length - 1}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}