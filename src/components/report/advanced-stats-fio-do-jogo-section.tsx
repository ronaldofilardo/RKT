'use client';

import { Section } from './advanced-stats-primitives';
import { usePlayerColors } from '@/components/ui/player-color.context';
import { tailwindClassToHex, type PremiumVisualProps } from './advanced-stats-premium-shared';
import { useFioDoJogoModel } from './advanced-stats-fio-do-jogo-model';
import { FioDoJogoFilters } from './advanced-stats-fio-do-jogo-filters';
import { FioDoJogoCards } from './advanced-stats-fio-do-jogo-cards';
import { FioDoJogoFlow } from './advanced-stats-fio-do-jogo-flow';
import { FioDoJogoRibbon } from './advanced-stats-fio-do-jogo-ribbon';

// Fio do Jogo — momentum & scoring runs (filtros + cards + fluxo + fita)
export function FioDoJogoSection({ stats, player1Name, player2Name, report }: PremiumVisualProps) {
  const colors = usePlayerColors();
  const p1Hex = tailwindClassToHex(colors.p1, '#CCFF00');
  const p2Hex = tailwindClassToHex(colors.p2, '#F8FAFC');

  const {
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
  } = useFioDoJogoModel({ stats, player1Name, player2Name, report });

  return (
    <Section title="Fio do Jogo — Momentum & Scoring Runs">
      {/* CABEÇALHO E FILTROS */}
      <FioDoJogoFilters
        selectedSetFilter={selectedSetFilter}
        onSelectSet={setSelectedSetFilter}
        minRunLength={minRunLength}
        onToggleMinRunLength={() => setMinRunLength((prev) => (prev === 2 ? 3 : 2))}
        availableSets={availableSets}
      />

      {/* CARDS DE RESUMO DE DOMÍNIO */}
      <FioDoJogoCards metrics={dominanceMetrics} p1Hex={p1Hex} p2Hex={p2Hex} />

      {/* FLOW CHART HORIZONTAL DOS SCORING RUNS */}
      <FioDoJogoFlow
        filteredRuns={filteredRuns}
        player1Name={player1Name}
        player2Name={player2Name}
        p1Hex={p1Hex}
        p2Hex={p2Hex}
      />

      {/* FITA PONTO-A-PONTO (BEAD MOMENTUM RIBBON) */}
      <FioDoJogoRibbon
        ribbonPoints={ribbonPoints}
        inspectedPoint={inspectedPoint}
        onInspect={setInspectedPoint}
        player1Name={player1Name}
        player2Name={player2Name}
      />
    </Section>
  );
}
