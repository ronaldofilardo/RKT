'use client';

import { Section, type AdvancedStatsSectionProps } from './advanced-stats-primitives';

interface MomentumProps {
  stats: AdvancedStatsSectionProps['stats'];
  player1Name?: string;
  player2Name?: string;
}

export function MomentumSection({ stats, player1Name = 'J1', player2Name = 'J2' }: MomentumProps) {
  const { momentum } = stats;
  const p1Streak = momentum.longestStreakP1 ?? momentum.longestWinningStreak;
  const p2Streak = momentum.longestStreakP2 ?? momentum.longestLosingStreak;

  return (
    <Section title="9. Momentum">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-telemetry-blue/10 rounded-lg p-3">
          <div className="text-2xl font-black text-telemetry-blue">{p1Streak}</div>
          <div className="text-xs text-telemetry-blue">Sequência Máx. Pontos Ganhos ({player1Name})</div>
        </div>
        <div className="bg-telemetry-error/10 rounded-lg p-3">
          <div className="text-2xl font-black text-telemetry-error">{p2Streak}</div>
          <div className="text-xs text-telemetry-error">Sequência Máx. Pontos Ganhos ({player2Name})</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-xs text-telemetry-text-muted">Sequência atual: </div>
        <div className={`text-lg font-bold ${momentum.currentStreak > 0 ? 'text-telemetry-blue' : 'text-telemetry-error'}`}>
          {momentum.currentStreak > 0 ? `${momentum.currentStreak} pts` : `${Math.abs(momentum.currentStreak)} pts`}
          <span className="text-xs text-telemetry-text-muted ml-1">
            ({momentum.currentStreak > 0 ? player1Name : player2Name})
          </span>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Sequências exatas por jogador</div>
        <table className="w-full text-xs border-collapse border border-white/10 rounded-lg">
          <thead>
            <tr className="bg-telemetry-elevated border-b border-white/10">
              <th className="text-left py-2 px-2 font-bold text-telemetry-text-primary">Sequência</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-blue">{player1Name}</th>
              <th className="text-center py-2 px-2 font-bold text-telemetry-error">{player2Name}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="py-2 px-2 text-telemetry-text-muted">Exatamente 2 pontos</td>
              <td className="text-center py-2 px-2 font-mono font-bold">{momentum.streakCountP1.len2}</td>
              <td className="text-center py-2 px-2 font-mono font-bold">{momentum.streakCountP2.len2}</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-2 text-telemetry-text-muted">Exatamente 3 pontos</td>
              <td className="text-center py-2 px-2 font-mono font-bold">{momentum.streakCountP1.len3}</td>
              <td className="text-center py-2 px-2 font-mono font-bold">{momentum.streakCountP2.len3}</td>
            </tr>
            <tr>
              <td className="py-2 px-2 text-telemetry-text-muted">4+ pontos</td>
              <td className="text-center py-2 px-2 font-mono font-bold">{momentum.streakCountP1.len4Plus}</td>
              <td className="text-center py-2 px-2 font-mono font-bold">{momentum.streakCountP2.len4Plus}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {momentum.scoringRuns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Sequências de 2+ Pontos</div>
          <div className="flex flex-wrap gap-1">
            {momentum.scoringRuns.map((run, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  run.player === 'PLAYER_1'
                    ? 'bg-telemetry-blue/20 text-telemetry-blue-light'
                    : 'bg-telemetry-error/20 text-telemetry-error-light'
                }`}
              >
                {run.length}x {run.player === 'PLAYER_1' ? player1Name : player2Name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
