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
      <StatRow label="Total no Fundo" p1={p1.total} p2={p2.total} />
      <StatRow label="% Sucesso no Fundo" p1={p1.successPct} p2={p2.successPct} format="pct" />
      <StatRow label="% Sucesso Rally Curto (1-3)" p1={p1.shortRallySuccessPct} p2={p2.shortRallySuccessPct} format="pct" />
      <StatRow label="% Sucesso Rally Médio (4-6)" p1={p1.mediumRallySuccessPct} p2={p2.mediumRallySuccessPct} format="pct" />
      <StatRow label="% Sucesso Rally Longo (7+)" p1={p1.longRallySuccessPct} p2={p2.longRallySuccessPct} format="pct" />
    </Section>
  );
}
