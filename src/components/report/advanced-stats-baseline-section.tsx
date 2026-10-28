'use client';

import {
  PlayerColumnHeader,
  Section,
  StatRow,
  type AdvancedStatsSectionProps,
} from './advanced-stats-primitives';

export function BaselineSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const p1 = stats.baseline?.player1;
  const p2 = stats.baseline?.player2;
  if (!p1 || !p2) return null;

  return (
    <Section title="3. Fundo de Quadra">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow label="Winners no Fundo" p1={p1.winners} p2={p2.winners} />
      <StatRow label="Erros Não Forçados" p1={p1.unforcedErrors} p2={p2.unforcedErrors} />
      <StatRow label="Erros Forçados" p1={p1.forcedErrors} p2={p2.forcedErrors} />
      <StatRow label="Aproveitamento/Total" p1={`${p1.winners}/${p1.total}`} p2={`${p2.winners}/${p2.total}`} />
      <StatRow label="% Aproveitamento no Fundo" p1={p1.successPct} p2={p2.successPct} format="pct" />
      <StatRow label="Rally Curto (1-4)" p1={`${p1.shortRallyWon}/${p1.shortRallyTotal}`} p2={`${p2.shortRallyWon}/${p2.shortRallyTotal}`} />
      <StatRow label="Rally Médio (5-8)" p1={`${p1.mediumRallyWon}/${p1.mediumRallyTotal}`} p2={`${p2.mediumRallyWon}/${p2.mediumRallyTotal}`} />
      <StatRow label="Rally Longo (9+)" p1={`${p1.longRallyWon}/${p1.longRallyTotal}`} p2={`${p2.longRallyWon}/${p2.longRallyTotal}`} />
    </Section>
  );
}
