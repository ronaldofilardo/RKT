'use client';

import { Section, type AdvancedStatsSectionProps } from './advanced-stats-primitives';

export function RallySection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const { shots } = stats;
  const dist = shots.player1.rallyLengthDistribution;
  const avgP1 = shots.player1.rallyAvgLength.toFixed(1);
  const avgP2 = shots.player2.rallyAvgLength.toFixed(1);

  return (
    <Section title="4. Rally">
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-telemetry-blue/10 rounded-lg p-2.5">
          <div className="font-bold text-lg text-telemetry-blue">{dist.short}</div>
          <div className="text-telemetry-text-muted mt-0.5">Curtos (1-3)</div>
        </div>
        <div className="bg-telemetry-alert/10 rounded-lg p-2.5">
          <div className="font-bold text-lg text-telemetry-alert">{dist.medium}</div>
          <div className="text-telemetry-text-muted mt-0.5">Médios (4-6)</div>
        </div>
        <div className="bg-telemetry-error/10 rounded-lg p-2.5">
          <div className="font-bold text-lg text-telemetry-error">{dist.long}</div>
          <div className="text-telemetry-text-muted mt-0.5">Longos (7+)</div>
        </div>
      </div>
      <div className="text-center text-xs text-telemetry-text-muted mt-3 pt-2 border-t border-white/10">
        Duração média por ponto:{' '}
        <span className="font-mono text-telemetry-blue font-semibold">{player1Name}: {avgP1}</span>
        <span className="text-white/30 mx-2">&bull;</span>
        <span className="font-mono text-telemetry-error font-semibold">{player2Name}: {avgP2}</span>
      </div>
    </Section>
  );
}
