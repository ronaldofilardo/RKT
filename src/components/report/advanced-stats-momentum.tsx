'use client';

import { Section, type AdvancedStatsSectionProps } from './advanced-stats-primitives';
import { usePlayerColors } from '@/components/ui/player-color.context';

interface MomentumProps {
  stats: AdvancedStatsSectionProps['stats'];
  player1Name?: string;
  player2Name?: string;
}

export function MomentumSection({ stats, player1Name = 'J1', player2Name = 'J2' }: MomentumProps) {
  const colors = usePlayerColors();
  const { momentum } = stats;
  const p1Streak = momentum.longestStreakP1 ?? momentum.longestWinningStreak;
  const p2Streak = momentum.longestStreakP2 ?? momentum.longestLosingStreak;
  const p1Leads = p1Streak > p2Streak;
  const p2Leads = p2Streak > p1Streak;

  return (
    <Section title="9. Momentum">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className={`rounded-lg p-3 ${p1Leads ? 'bg-white/10' : 'bg-white/5'}`}>
          <div className={`text-2xl font-black ${colors.p1}`}>{p1Streak}</div>
          <div className="text-xs text-telemetry-text-muted">Sequência Máx. Pontos Ganhos ({player1Name})</div>
        </div>
        <div className={`rounded-lg p-3 ${p2Leads ? 'bg-white/10' : 'bg-white/5'}`}>
          <div className={`text-2xl font-black ${colors.p2}`}>{p2Streak}</div>
          <div className="text-xs text-telemetry-text-muted">Sequência Máx. Pontos Ganhos ({player2Name})</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-semibold text-telemetry-text-primary mb-2">Sequências por jogador</div>
        <table className="w-full text-xs border-collapse border border-white/10 rounded-lg">
          <thead>
            <tr className="bg-telemetry-elevated border-b border-white/10">
              <th className="text-left py-2 px-2 font-bold text-telemetry-text-primary">Sequência</th>
              <th className={`text-center py-2 px-2 font-bold ${colors.p1}`}>{player1Name}</th>
              <th className={`text-center py-2 px-2 font-bold ${colors.p2}`}>{player2Name}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="py-2 px-2 text-telemetry-text-muted">2 pontos ganhos seguidos</td>
              <td className={`text-center py-2 px-2 font-mono font-bold ${colors.p1}`}>{momentum.streakCountP1.len2}</td>
              <td className={`text-center py-2 px-2 font-mono font-bold ${colors.p2}`}>{momentum.streakCountP2.len2}</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-2 px-2 text-telemetry-text-muted">3 pontos ganhos seguidos</td>
              <td className={`text-center py-2 px-2 font-mono font-bold ${colors.p1}`}>{momentum.streakCountP1.len3}</td>
              <td className={`text-center py-2 px-2 font-mono font-bold ${colors.p2}`}>{momentum.streakCountP2.len3}</td>
            </tr>
            <tr>
              <td className="py-2 px-2 text-telemetry-text-muted">4+ pontos ganhos seguidos</td>
              <td className={`text-center py-2 px-2 font-mono font-bold ${colors.p1}`}>{momentum.streakCountP1.len4Plus}</td>
              <td className={`text-center py-2 px-2 font-mono font-bold ${colors.p2}`}>{momentum.streakCountP2.len4Plus}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}