import { useMemo, useState } from 'react';
import type { TimelinePoint } from '@/core/scoring/types';
import type { PremiumVisualProps } from './advanced-stats-premium-shared';
import { extractChronologicalRuns, type ChronoRun } from './advanced-stats-fio-do-jogo-runs';
import { buildFallbackRuns, computeDominanceMetrics } from './advanced-stats-fio-do-jogo-metrics';

// Estado + memos do Fio do Jogo (separado do JSX para respeitar o limite R-03)
export function useFioDoJogoModel({ stats, report }: PremiumVisualProps) {
  const [selectedSetFilter, setSelectedSetFilter] = useState<number | 'ALL'>('ALL');
  const [minRunLength, setMinRunLength] = useState<number>(2);
  const [inspectedPoint, setInspectedPoint] = useState<TimelinePoint | null>(null);

  const points = useMemo(() => report?.timelinePoints ?? [], [report?.timelinePoints]);

  // Extrair runs cronológicos a partir de points (fallback: stats.momentum)
  const allChronologicalRuns = useMemo<ChronoRun[]>(() => {
    if (points.length > 0) return extractChronologicalRuns(points);
    return buildFallbackRuns(stats);
  }, [points, stats]);

  // Filtrar runs pelo set selecionado e comprimento mínimo
  const filteredRuns = useMemo(() => {
    return allChronologicalRuns.filter((run) => {
      if (selectedSetFilter !== 'ALL' && run.setNumber !== selectedSetFilter) return false;
      if (run.length < minRunLength) return false;
      return true;
    });
  }, [allChronologicalRuns, selectedSetFilter, minRunLength]);

  // Sets presentes nos pontos
  const availableSets = useMemo(() => {
    const s = new Set<number>();
    points.forEach((p) => s.add(p.setNumber));
    if (s.size === 0 && stats.setBreakdown) {
      stats.setBreakdown.forEach((sb) => s.add(sb.setNumber));
    }
    return Array.from(s).sort();
  }, [points, stats.setBreakdown]);

  const dominanceMetrics = useMemo(
    () => computeDominanceMetrics(allChronologicalRuns, stats),
    [allChronologicalRuns, stats],
  );

  // Pontos filtrados para a fita ponto-a-ponto
  const ribbonPoints = useMemo(() => {
    if (selectedSetFilter === 'ALL') return points;
    return points.filter((p) => p.setNumber === selectedSetFilter);
  }, [points, selectedSetFilter]);

  return {
    selectedSetFilter,
    setSelectedSetFilter,
    minRunLength,
    setMinRunLength,
    inspectedPoint,
    setInspectedPoint,
    filteredRuns,
    availableSets,
    dominanceMetrics,
    ribbonPoints,
  };
}
