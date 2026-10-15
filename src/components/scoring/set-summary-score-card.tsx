'use client';

import type { SetSummaryReport } from '@/core/scoring/set-summary-stats';

interface SetSummaryScoreCardProps {
  summary: Pick<SetSummaryReport, 'score' | 'winner'>;
  player1Name: string;
  player2Name: string;
}

/** Card de placar do set (P1 × P2 com marcação do vencedor e placar de tiebreak). */
export function SetSummaryScoreCard({ summary, player1Name, player2Name }: SetSummaryScoreCardProps) {
  return (
    <div className="bg-telemetry-elevated/60 border border-white/10 rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-telemetry-blue inline-block" />
        <span className="font-bold text-sm text-telemetry-text-primary">{player1Name}</span>
      </div>
      <div className="flex items-center gap-2 text-xl font-mono font-black">
        <span className={summary.winner === 'player1' ? 'text-telemetry-volt' : 'text-telemetry-text-primary'}>
          {summary.score.player1}
        </span>
        <span className="text-telemetry-text-muted text-sm">×</span>
        <span className={summary.winner === 'player2' ? 'text-telemetry-volt' : 'text-telemetry-text-primary'}>
          {summary.score.player2}
        </span>
        {summary.score.tiebreakScore && (
          <span className="text-xs text-telemetry-text-muted font-sans ml-1">
            ({Math.min(summary.score.tiebreakScore.player1, summary.score.tiebreakScore.player2)})
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm text-telemetry-text-primary">{player2Name}</span>
        <span className="w-3 h-3 rounded-full bg-telemetry-error inline-block" />
      </div>
    </div>
  );
}
