'use client';

import {
  PlayerColumnHeader,
  Section,
  StatRow,
  type AdvancedStatsSectionProps,
} from './advanced-stats-primitives';

export function PointDefinitionSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const p1 = stats.pointDefinition?.player1;
  const p2 = stats.pointDefinition?.player2;
  if (!p1 || !p2) return null;

  return (
    <Section title="7. Definição do Ponto">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow label="Winners (sem Ace)" p1={p1.cleanWinners} p2={p2.cleanWinners} />
      <StatRow label="Erros Forçados" p1={p1.forcedErrors} p2={p2.forcedErrors} />
      <StatRow label="Erros Não Forçados" p1={p1.unforcedErrors} p2={p2.unforcedErrors} />
      <StatRow label="Total Golpes Definição" p1={p1.total} p2={p2.total} />
    </Section>
  );
}
