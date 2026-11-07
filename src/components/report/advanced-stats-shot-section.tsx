'use client';

import { PlayerColumnHeader, Section, StatRow, type AdvancedStatsSectionProps } from './advanced-stats-primitives';
import { ByStrokeGrid } from './advanced-stats-by-stroke-grid';
import { usePlayerColors } from '@/components/ui/player-color.context';

type Props = AdvancedStatsSectionProps;

export function ShotSection({ stats, player1Name, player2Name }: Props) {
  const colors = usePlayerColors();
  const { shots } = stats;
  return (
    <Section title="Análise de Lances">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow label="Winners" p1={shots.player1.winners} p2={shots.player2.winners} />
      <StatRow label="Erros Forçados" p1={shots.player1.forcedErrors} p2={shots.player2.forcedErrors} />
      <StatRow label="Erros Não Forçados" p1={shots.player1.unforcedErrors} p2={shots.player2.unforcedErrors} tone="error" />
      <StatRow label="Aproximações à Rede" p1={`${shots.player1.netApproachesWon}/${shots.player1.netApproaches}`} p2={`${shots.player2.netApproachesWon}/${shots.player2.netApproaches}`} />
      <StatRow label="% Rede" p1={shots.player1.netApproachPct} p2={shots.player2.netApproachPct} format="pct" />
      <StatRow label="Smashes" p1={shots.player1.smashCount} p2={shots.player2.smashCount} />
      <StatRow label="Lobs" p1={shots.player1.lobCount} p2={shots.player2.lobCount} />
      <StatRow label="Drop Shots" p1={shots.player1.dropShotCount} p2={shots.player2.dropShotCount} />

      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Distribuição de Rally</div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-telemetry-blue/10 rounded-lg p-2">
            <div className="font-bold text-telemetry-blue">{shots.player1.rallyLengthDistribution.short}</div>
            <div className="text-telemetry-blue">Curtos (1-4)</div>
            <div className="font-bold text-telemetry-blue mt-1">{shots.player2.rallyLengthDistribution.short}</div>
          </div>
          <div className="bg-telemetry-alert/10 rounded-lg p-2">
            <div className="font-bold text-telemetry-alert">{shots.player1.rallyLengthDistribution.medium}</div>
            <div className="text-telemetry-alert">Médios (5-8)</div>
            <div className="font-bold text-telemetry-alert mt-1">{shots.player2.rallyLengthDistribution.medium}</div>
          </div>
          <div className="bg-telemetry-error/10 rounded-lg p-2">
            <div className="font-bold text-telemetry-error">{shots.player1.rallyLengthDistribution.long}</div>
            <div className="text-telemetry-error">Longos (9+)</div>
            <div className="font-bold text-telemetry-error mt-1">{shots.player2.rallyLengthDistribution.long}</div>
          </div>
        </div>
        <div className="text-center text-xs text-telemetry-text-muted mt-2">
          Duração média do rally:{' '}
          <span className={`font-mono ${colors.p1}`}>{shots.player1.rallyAvgLength.toFixed(1)}</span>
          <span className="text-white/30 mx-2">&bull;</span>
          <span className={`font-mono ${colors.p2}`}>{shots.player2.rallyAvgLength.toFixed(1)}</span>
        </div>
      </div>

      <ByStrokeGrid
        title="Winners por Golpe"
        p1={shots.player1.winnersByStroke}
        p2={shots.player2.winnersByStroke}
      />

      <ByStrokeGrid
        title="Erros Não Forçados por Golpe"
        p1={shots.player1.unforcedErrorsByStroke}
        p2={shots.player2.unforcedErrorsByStroke}
        tone="error"
      />

      {(shots.player1.backhandStats.total > 0 || shots.player2.backhandStats.total > 0) ? (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Balanço de Backhand (Winners / ENF / EF)</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className={`bg-white/5 rounded px-2 py-1 font-mono ${colors.p1}`}>
              {shots.player1.backhandStats.winners}W / {shots.player1.backhandStats.unforcedErrors}ENF / {shots.player1.backhandStats.forcedErrors}EF
            </div>
            <div className={`bg-white/5 rounded px-2 py-1 font-mono ${colors.p2}`}>
              {shots.player2.backhandStats.winners}W / {shots.player2.backhandStats.unforcedErrors}ENF / {shots.player2.backhandStats.forcedErrors}EF
            </div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
