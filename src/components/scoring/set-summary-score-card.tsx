'use client';

import type { SetSummaryReport } from '@/core/scoring/set-summary-stats';

interface SetSummaryScoreCardProps {
  summary: Pick<SetSummaryReport, 'score' | 'winner'>;
  player1Name: string;
  player2Name: string;
  isMatchTiebreak?: boolean;
}

/** Card de placar do set (P1 × P2 com marcação do vencedor e placar de tiebreak). */
export function SetSummaryScoreCard({
  summary,
  player1Name,
  player2Name,
  isMatchTiebreak = false,
}: SetSummaryScoreCardProps) {
  const p1Score = isMatchTiebreak
    ? (summary.score.tiebreakScore?.player1 ?? summary.score.player1)
    : summary.score.player1;
  const p2Score = isMatchTiebreak
    ? (summary.score.tiebreakScore?.player2 ?? summary.score.player2)
    : summary.score.player2;

  return (
    <div className="bg-telemetry-elevated/60 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="w-3 h-3 rounded-full bg-telemetry-blue inline-block flex-shrink-0" />
        <span className="font-bold text-xs sm:text-sm text-telemetry-text-primary truncate" title={player1Name}>
          {player1Name}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xl font-mono font-black flex-shrink-0">
        <span className={summary.winner === 'player1' ? 'text-telemetry-volt' : 'text-telemetry-text-primary'}>
          {p1Score}
        </span>
        <span className="text-telemetry-text-muted text-sm">×</span>
        <span className={summary.winner === 'player2' ? 'text-telemetry-volt' : 'text-telemetry-text-primary'}>
          {p2Score}
        </span>
        {!isMatchTiebreak && summary.score.tiebreakScore && (
          <span className="text-xs text-telemetry-text-muted font-sans ml-1">
            ({Math.min(summary.score.tiebreakScore.player1, summary.score.tiebreakScore.player2)})
          </span>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
        <span className="font-bold text-xs sm:text-sm text-telemetry-text-primary truncate" title={player2Name}>
          {player2Name}
        </span>
        <span className="w-3 h-3 rounded-full bg-telemetry-error inline-block flex-shrink-0" />
      </div>
    </div>
  );
}
