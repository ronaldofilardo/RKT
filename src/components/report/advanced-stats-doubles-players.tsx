'use client';

import type { ReportData } from '@/app/match/[id]/report/report.types';
import { Section } from './advanced-stats-primitives';
import { computeDoublesPlayerStats, type DoublesPlayerMetrics } from '@/core/report/doubles-player-stats.logic';

export function DoublesPlayerBreakdownSection({ report }: { report?: ReportData }) {
  if (!report || report.matchType !== 'DOUBLES') return null;

  const points = report.timelinePoints;
  const players: Array<{ player: { id: string; name: string }; team: 'PLAYER_1' | 'PLAYER_2' }> = [];

  if (report.player1) players.push({ player: report.player1, team: 'PLAYER_1' });
  if (report.player1Partner) players.push({ player: report.player1Partner, team: 'PLAYER_1' });
  if (report.player2) players.push({ player: report.player2, team: 'PLAYER_2' });
  if (report.player2Partner) players.push({ player: report.player2Partner, team: 'PLAYER_2' });

  const metrics: DoublesPlayerMetrics[] = players.map(p =>
    computeDoublesPlayerStats(points, p.player, p.team),
  );

  return (
    <Section title="Estatísticas Individuais por Jogador (Duplas)">
      <div className="space-y-4">
        {metrics.map(m => (
          <div key={m.playerId} className="bg-white/5 rounded-lg p-3 text-xs border border-white/5">
            <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/10 font-bold">
              <span className={m.team === 'PLAYER_1' ? 'text-telemetry-blue' : 'text-telemetry-error'}>
                {m.playerName}
              </span>
              <span className="text-telemetry-text-muted text-[11px] font-normal uppercase">
                {m.team === 'PLAYER_1' ? 'Dupla 1' : 'Dupla 2'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-telemetry-text-muted font-mono">
              <div>
                <span className="text-[10px] block uppercase text-white/40">Saque (Aces/DF)</span>
                <span className="text-white font-bold">{m.aces}</span> aces /{' '}
                <span className="text-telemetry-error">{m.doubleFaults}</span> df
              </div>
              <div>
                <span className="text-[10px] block uppercase text-white/40">Winners / Erros</span>
                <span className="text-telemetry-blue font-bold">{m.winners}</span> W /{' '}
                <span className="text-telemetry-error">{m.unforcedErrors}</span> ENF
              </div>
              <div>
                <span className="text-[10px] block uppercase text-white/40">Pontos de Rede</span>
                <span className="text-white font-bold">{m.netPointsWon}</span> pts
              </div>
              <div>
                <span className="text-[10px] block uppercase text-white/40">Pts Ganhos (Lado)</span>
                <span className="text-white">{m.deuceSidePointsWon}</span> Ig. /{' '}
                <span className="text-white">{m.adSidePointsWon}</span> Vant.
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
