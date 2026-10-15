'use client';

import {
  PlayerColumnHeader,
  Section,
  StatRow,
  type AdvancedStatsSectionProps,
} from './advanced-stats-primitives';
import { ServeSection, ReturnSection, PressureSection } from './advanced-stats-basic-sections';

type Props = AdvancedStatsSectionProps;

function ShotSection({ stats, player1Name, player2Name }: Props) {
  const { shots } = stats;
  return (
    <Section title="Análise de Lances">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <StatRow label="Winners" p1={shots.player1.winners} p2={shots.player2.winners} />
      <StatRow label="Erros Forçados" p1={shots.player1.forcedErrors} p2={shots.player2.forcedErrors} />
      <StatRow label="Erros Não Forçados" p1={shots.player1.unforcedErrors} p2={shots.player2.unforcedErrors} />
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
            <div className="font-bold text-telemetry-error mt-1">{shots.player2.rallyLengthDistribution.short}</div>
          </div>
          <div className="bg-telemetry-alert/10 rounded-lg p-2">
            <div className="font-bold text-telemetry-alert">{shots.player1.rallyLengthDistribution.medium}</div>
            <div className="text-telemetry-alert">Médios (5-8)</div>
            <div className="font-bold text-telemetry-error mt-1">{shots.player2.rallyLengthDistribution.medium}</div>
          </div>
          <div className="bg-telemetry-error/10 rounded-lg p-2">
            <div className="font-bold text-telemetry-error">{shots.player1.rallyLengthDistribution.long}</div>
            <div className="text-telemetry-error">Longos (9+)</div>
            <div className="font-bold text-telemetry-error mt-1">{shots.player2.rallyLengthDistribution.long}</div>
          </div>
        </div>
        <div className="text-center text-xs text-telemetry-text-muted mt-2">
          Duração média do rally: <span className="font-mono">{shots.player1.rallyAvgLength.toFixed(1)} vs {shots.player2.rallyAvgLength.toFixed(1)}</span>
        </div>
      </div>

      {Object.keys(shots.player1.winnersByStroke).length > 0 || Object.keys(shots.player2.winnersByStroke).length > 0 ? (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Winners por Golpe</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(shots.player1.winnersByStroke).map(([stroke, count]) => (
              <div key={stroke} className="flex justify-between bg-telemetry-blue/10 rounded px-2 py-1">
                <span className="text-telemetry-blue">{stroke.toUpperCase()}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
            {Object.entries(shots.player2.winnersByStroke).map(([stroke, count]) => (
              <div key={stroke} className="flex justify-between bg-telemetry-error/10 rounded px-2 py-1">
                <span className="text-telemetry-error">{stroke.toUpperCase()}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {Object.keys(shots.player1.unforcedErrorsByStroke).length > 0 || Object.keys(shots.player2.unforcedErrorsByStroke).length > 0 ? (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Erros Não Forçados por Golpe</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(shots.player1.unforcedErrorsByStroke).map(([stroke, count]) => (
              <div key={stroke} className="flex justify-between bg-telemetry-blue/10 rounded px-2 py-1">
                <span className="text-telemetry-blue">{stroke.toUpperCase()}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
            {Object.entries(shots.player2.unforcedErrorsByStroke).map(([stroke, count]) => (
              <div key={stroke} className="flex justify-between bg-telemetry-error/10 rounded px-2 py-1">
                <span className="text-telemetry-error">{stroke.toUpperCase()}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(shots.player1.backhandStats.total > 0 || shots.player2.backhandStats.total > 0) ? (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Balanço de Backhand (Winners / ENF / EF)</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="bg-telemetry-blue/10 rounded px-2 py-1 text-telemetry-blue font-mono">
              {shots.player1.backhandStats.winners}W / {shots.player1.backhandStats.unforcedErrors}ENF / {shots.player1.backhandStats.forcedErrors}EF
            </div>
            <div className="bg-telemetry-error/10 rounded px-2 py-1 text-telemetry-error font-mono">
              {shots.player2.backhandStats.winners}W / {shots.player2.backhandStats.unforcedErrors}ENF / {shots.player2.backhandStats.forcedErrors}EF
            </div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}

function MomentumSection({ stats }: { stats: AdvancedStatsSectionProps['stats'] }) {
  const { momentum } = stats;
  return (
    <Section title="Momentum">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-telemetry-blue/10 rounded-lg p-3">
          <div className="text-2xl font-black text-telemetry-blue">{momentum.longestWinningStreak}</div>
          <div className="text-xs text-telemetry-blue">Sequência Máx. Pontos Ganhos (J1)</div>
        </div>
        <div className="bg-telemetry-error/10 rounded-lg p-3">
          <div className="text-2xl font-black text-telemetry-error">{momentum.longestLosingStreak}</div>
          <div className="text-xs text-telemetry-error">Sequência Máx. Pontos Ganhos (J2)</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-xs text-telemetry-text-muted">Sequência atual: </div>
        <div className={`text-lg font-bold ${momentum.currentStreak > 0 ? 'text-telemetry-blue' : 'text-telemetry-error'}`}>
          {momentum.currentStreak > 0 ? `${momentum.currentStreak} pts` : `${Math.abs(momentum.currentStreak)} pts`}
          <span className="text-xs text-telemetry-text-muted ml-1">
            {momentum.currentStreak > 0 ? '(J1)' : '(J2)'}
          </span>
        </div>
      </div>
      {momentum.scoringRuns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Sequências de 3+ Pontos</div>
          <div className="flex flex-wrap gap-1">
            {momentum.scoringRuns.slice(0, 5).map((run, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  run.player === 'PLAYER_1'
                    ? 'bg-telemetry-blue/20 text-telemetry-blue-light'
                    : 'bg-telemetry-error/20 text-telemetry-error-light'
                }`}
              >
                {run.length}x {run.player === 'PLAYER_1' ? 'J1' : 'J2'}
              </span>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

function SetBreakdownSection({ stats, player1Name, player2Name }: Props) {
  return (
    <Section title="Breakdown por Set">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-white/10">
              <th className="text-left py-2 px-2 font-bold text-telemetry-text-primary">Set</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-blue">{player1Name}</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-error">{player2Name}</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-text-primary">Pontos</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-text-primary">Aces</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-text-primary">Winners</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-text-primary">Erros</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-text-primary">Duração</th>
            </tr>
          </thead>
          <tbody>
            {stats.setBreakdown.map(set => (
              <tr key={set.setNumber} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2 px-2 font-bold text-telemetry-text-primary">
                  Set {set.setNumber}
                  {set.isTiebreak && <span className="text-telemetry-alert ml-1 font-bold">TB</span>}
                </td>
                <td className="text-center py-2 px-2 text-telemetry-blue font-mono font-bold text-sm">
                  {set.p1Games}x{set.p2Games}
                </td>
                <td className="text-center py-2 px-2 text-telemetry-error font-mono font-bold text-sm">
                  {set.p1Games}x{set.p2Games}
                </td>
                <td className="text-center py-2 px-2">
                  <span className="text-telemetry-blue font-bold">{set.p1Points}</span>
                  <span className="text-telemetry-text-muted/50 mx-1">/</span>
                  <span className="text-telemetry-error font-bold">{set.p2Points}</span>
                </td>
                <td className="text-center py-2 px-2">
                  <span className="text-telemetry-blue font-bold">{set.p1Aces}</span>
                  <span className="text-telemetry-text-muted/50 mx-1">/</span>
                  <span className="text-telemetry-error font-bold">{set.p2Aces}</span>
                </td>
                <td className="text-center py-2 px-2">
                  <span className="text-telemetry-blue font-bold">{set.p1Winners}</span>
                  <span className="text-telemetry-text-muted/50 mx-1">/</span>
                  <span className="text-telemetry-error font-bold">{set.p2Winners}</span>
                </td>
                <td className="text-center py-2 px-2">
                  <span className="text-telemetry-blue font-bold">{set.p1Errors}</span>
                  <span className="text-telemetry-text-muted/50 mx-1">/</span>
                  <span className="text-telemetry-error font-bold">{set.p2Errors}</span>
                </td>
                <td className="text-center py-2 px-2 text-telemetry-text-primary font-mono font-bold">
                  {set.duration != null ? `${set.duration}min` : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function AdvancedStats({ stats, player1Name, player2Name }: Props) {
  return (
    <div className="space-y-4">
      <ServeSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <ReturnSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <PressureSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <ShotSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
      <MomentumSection stats={stats} />
      <SetBreakdownSection stats={stats} player1Name={player1Name} player2Name={player2Name} />
    </div>
  );
}
