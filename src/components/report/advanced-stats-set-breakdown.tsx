'use client';

import { Section, type AdvancedStatsSectionProps } from './advanced-stats-primitives';

export function SetBreakdownSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const totalDuration = stats.durations?.totalDurationMinutes;
  return (
    <Section title="10. Breakdown por Set">
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
                  {set.isTiebreak && set.tiebreakP1 != null && set.tiebreakP2 != null && (
                    <span className="text-[10px] text-telemetry-text-muted ml-1 font-normal">
                      ({set.tiebreakP1}-{set.tiebreakP2})
                    </span>
                  )}
                </td>
                <td className="text-center py-2 px-2 text-telemetry-error font-mono font-bold text-sm">
                  {set.p2Games}x{set.p1Games}
                  {set.isTiebreak && set.tiebreakP1 != null && set.tiebreakP2 != null && (
                    <span className="text-[10px] text-telemetry-text-muted ml-1 font-normal">
                      ({set.tiebreakP2}-{set.tiebreakP1})
                    </span>
                  )}
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
            {totalDuration != null && totalDuration > 0 && (
              <tr className="bg-telemetry-elevated font-bold border-t border-white/10">
                <td className="py-2 px-2 text-telemetry-text-primary">Total</td>
                <td className="text-center py-2 px-2" colSpan={6} aria-hidden="true" />
                <td className="text-center py-2 px-2 text-telemetry-text-primary font-mono">
                  {totalDuration} min
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
