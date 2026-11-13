import { useMemo, useState } from 'react';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import { computeSetRadarAxes } from './advanced-stats-set-lens-axes';
import { computeSetRadarAxesFromBreakdown, computeSetWinnerInfo } from './advanced-stats-set-lens-breakdown';
import { buildComparativeBars } from './advanced-stats-set-lens-bars';
import type { PremiumVisualProps } from './advanced-stats-premium-shared';

// Estado + memos do Set Lens (separado do JSX para respeitar o limite R-03)
export function useSetLensModel({ stats, player1Name, player2Name, report }: PremiumVisualProps, p1Hex: string, p2Hex: string) {
  // Determinar sets disponíveis a partir de stats.setBreakdown ou timelinePoints
  const sets = useMemo(() => {
    if (stats.setBreakdown && stats.setBreakdown.length > 0) {
      return stats.setBreakdown;
    }
    // Fallback: se não tiver setBreakdown, simular Set 1 com totais
    return [
      {
        setNumber: 1,
        totalPoints: 0,
        p1Points: 0,
        p2Points: 0,
        p1Games: 0,
        p2Games: 0,
        isTiebreak: false,
        p1Aces: 0,
        p2Aces: 0,
        p1Winners: 0,
        p2Winners: 0,
        p1Errors: 0,
        p2Errors: 0,
      },
    ];
  }, [stats.setBreakdown]);

  const [selectedSet, setSelectedSet] = useState<number>(() => sets[0]?.setNumber ?? 1);

  // Set Breakdown do set selecionado
  const currentSetBreakdown = useMemo(() => {
    return sets.find((s) => s.setNumber === selectedSet) || sets[0];
  }, [sets, selectedSet]);

  // Se houver timelinePoints no report, calcular stats ricas específicas deste set
  const currentSetFullStats = useMemo(() => {
    if (!report?.timelinePoints || report.timelinePoints.length === 0) return null;
    const setPoints = report.timelinePoints.filter((p) => p.setNumber === selectedSet);
    if (setPoints.length === 0) return null;
    try {
      return computeAdvancedStats(setPoints, report.format);
    } catch {
      return null;
    }
  }, [report, selectedSet]);

  // Eixos do radar para o set ativo
  const radarAxes = useMemo(() => {
    if (currentSetFullStats) {
      return computeSetRadarAxes(currentSetFullStats);
    }
    return computeSetRadarAxesFromBreakdown(currentSetBreakdown);
  }, [currentSetFullStats, currentSetBreakdown]);

  // Identificação do vencedor do set
  const setWinnerInfo = useMemo(
    () => computeSetWinnerInfo(currentSetBreakdown, player1Name, player2Name, p1Hex, p2Hex),
    [currentSetBreakdown, player1Name, player2Name, p1Hex, p2Hex],
  );

  // Dados para as barras comparativas
  const compBars = useMemo(
    () => buildComparativeBars(currentSetBreakdown, currentSetFullStats),
    [currentSetBreakdown, currentSetFullStats],
  );

  return {
    sets,
    selectedSet,
    setSelectedSet,
    currentSetBreakdown,
    radarAxes,
    setWinnerInfo,
    compBars,
  };
}
