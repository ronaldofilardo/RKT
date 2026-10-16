'use client';

import { useState, useMemo } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import { filterTimelinePoints, countByFilter } from './timeline.logic';
import type { FilterKey, FilterCriteria } from './timeline-types';

export function useTimelineFilters(points: TimelinePoint[]) {
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

  return {
    activeFilters,
    toggleFilter,
    clearFilters,
    hasActiveFilters,
    filteredPoints,
    groupedBySet,
    counts,
  };
}
