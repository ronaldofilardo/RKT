'use client';

import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import { SetSummaryHeader } from './set-summary-header';
import { SetSummaryFooter } from './set-summary-footer';
import { SetSummaryBody } from './set-summary-body';
import { useSetSummaryReport, type CompletedSetData } from './use-set-summary-report';
import { isSetMatchTiebreak } from './set-summary-mtb.logic';

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

  const isMatchTiebreak = isSetMatchTiebreak(selectedSet, format);
  const isMTBFormat = format === 'MATCH_TB_10';

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
          format={format}
        />

        <SetSummaryBody
          summary={summary}
          player1Name={player1Name}
          player2Name={player2Name}
          isMatchTiebreak={isMatchTiebreak}
        />

        <SetSummaryFooter
          isMatchFinished={isMatchFinished}
          onViewReport={onViewReport}
          onResumeMatch={onResumeMatch}
          isLastCompletedSet={selectedSet >= completedSetsCount}
          nextSetNumber={selectedSet + 1}
          onClose={onClose}
          onOpenDoublesArrangement={onOpenDoublesArrangement}
          isMatchTiebreakFormat={isMTBFormat}
        />
      </div>
    </div>
  );
}
