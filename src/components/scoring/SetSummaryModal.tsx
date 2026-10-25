'use client';

import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import { GameErrorsHistogram } from './GameErrorsHistogram';
import { SetSummaryStatsSections } from './set-summary-stats-sections';
import { SetSummaryHeader } from './set-summary-header';
import { SetSummaryScoreCard } from './set-summary-score-card';
import { SetSummaryFooter } from './set-summary-footer';
import { useSetSummaryReport, type CompletedSetData } from './use-set-summary-report';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onResumeMatch?: () => void;
  timelinePoints: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  initialSetNumber?: number;
  completedSetsCount: number;
  isMatchFinished?: boolean;
  onViewReport?: () => void;
  completedSetsData?: CompletedSetData[];
  onOpenDoublesArrangement?: () => void;
  format?: TennisFormat;
}

export function SetSummaryModal({
  isOpen,
  onClose,
  onResumeMatch,
  timelinePoints,
  player1Name,
  player2Name,
  initialSetNumber = 1,
  completedSetsCount,
  isMatchFinished = false,
  onViewReport,
  completedSetsData,
  onOpenDoublesArrangement,
  format,
}: Props) {
  const { availableSets, selectedSet, setSelectedSet, summary } = useSetSummaryReport({
    initialSetNumber,
    completedSetsCount,
    timelinePoints,
    completedSetsData,
    format,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-summary-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-telemetry-card border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-telemetry-text-primary">
        <SetSummaryHeader
          selectedSet={selectedSet}
          durationMinutes={summary.durationMinutes}
          availableSets={availableSets}
          onSelectSet={setSelectedSet}
          onClose={onClose}
        />

        {/* Conteúdo rolável */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          <SetSummaryScoreCard summary={summary} player1Name={player1Name} player2Name={player2Name} />

          <SetSummaryStatsSections p1={summary.player1} p2={summary.player2} />

          {/* Seção 3: Histograma de Erros por Game */}
          <div className="bg-telemetry-elevated/40 border border-white/10 rounded-xl p-3.5">
            <GameErrorsHistogram
              gameErrors={summary.gameErrors}
              player1Name={player1Name}
              player2Name={player2Name}
            />
          </div>
        </div>

        <SetSummaryFooter
          isMatchFinished={isMatchFinished}
          onViewReport={onViewReport}
          onResumeMatch={onResumeMatch}
          isLastCompletedSet={selectedSet >= completedSetsCount}
          nextSetNumber={selectedSet + 1}
          onClose={onClose}
          onOpenDoublesArrangement={onOpenDoublesArrangement}
        />
      </div>
    </div>
  );
}
