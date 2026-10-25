'use client';

import {
  PlayerColumnHeader,
  Section,
  StatRow,
  type AdvancedStatsSectionProps,
} from './advanced-stats-primitives';

export function NetPassSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const p1 = stats.netPass?.player1;
  const p2 = stats.netPass?.player2;
  if (!p1 || !p2) return null;

  return (
    <Section title="5. Rede e Passada">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow
        label="Subidas à Rede"
        p1={`${p1.netApproachesWon}/${p1.netApproaches}`}
        p2={`${p2.netApproachesWon}/${p2.netApproaches}`}
      />
      <StatRow
        label="% Sucesso na Rede"
        p1={p1.netApproachPct}
        p2={p2.netApproachPct}
        format="pct"
      />
      <StatRow
        label="Passadas"
        p1={`${p1.passingShotsWon}/${p1.passingShotsAttempted}`}
        p2={`${p2.passingShotsWon}/${p2.passingShotsAttempted}`}
      />
      <StatRow
        label="% Sucesso na Passada"
        p1={p1.passingShotPct}
        p2={p2.passingShotPct}
        format="pct"
      />
    </Section>
  );
}
