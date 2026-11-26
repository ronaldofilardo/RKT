'use client';

import { GameErrorsHistogram } from './GameErrorsHistogram';
import { SetSummaryStatsSections } from './set-summary-stats-sections';
import { SetSummaryScoreCard } from './set-summary-score-card';
import type { useSetSummaryReport } from './use-set-summary-report';

type SetSummary = ReturnType<typeof useSetSummaryReport>['summary'];

interface SetSummaryBodyProps {
  summary: SetSummary;
  player1Name: string;
  player2Name: string;
  isMatchTiebreak: boolean;
}

/** Corpo rolável do resumo de set: placar, estatísticas e histograma de erros por game. */
export function SetSummaryBody({ summary, player1Name, player2Name, isMatchTiebreak }: SetSummaryBodyProps) {
  return (
    <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
      <SetSummaryScoreCard
        summary={summary}
        player1Name={player1Name}
        player2Name={player2Name}
        isMatchTiebreak={isMatchTiebreak}
      />

      <SetSummaryStatsSections
        p1={summary.player1}
        p2={summary.player2}
        isMatchTiebreak={isMatchTiebreak}
      />

      {/* Seção 3: Histograma de Erros por Game */}
      <div className="bg-telemetry-elevated/40 border border-white/10 rounded-xl p-3.5">
        <GameErrorsHistogram
          gameErrors={summary.gameErrors}
          player1Name={player1Name}
          player2Name={player2Name}
        />
      </div>
    </div>
  );
}
