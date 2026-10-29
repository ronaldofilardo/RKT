"use client";

import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import type { ScoringPageDerived } from "./useScoringPageDerived";
import { ScoringEditScoreModal } from "./scoring-edit-score-modal";
import { ScoringSessionModals } from "./scoring-session-modals";
import { PointDetailsModalBlock } from "./scoring-point-modals";
import { ShareSpectateModal } from "@/components/scoring/ShareSpectateModal";

interface ScoringModalsProps {
  state: ScoringPageState;
  handlers: ScoringPageHandlers;
  derived: ScoringPageDerived;
  match: NonNullable<ScoringPageState["match"]>;
  matchId: string;
  cameFromDashboard: boolean;
  setSummaryModalState: { isOpen: boolean; setNumber: number };
  onCloseSetSummary: () => void;
  onNavigateDashboard: () => void;
  onNavigateReport: () => void;
  isShareModalOpen?: boolean;
  onCloseShareModal?: () => void;
}

export function ScoringModals({
  state,
  handlers,
  derived,
  match,
  matchId,
  cameFromDashboard,
  setSummaryModalState,
  onCloseSetSummary,
  onNavigateDashboard,
  onNavigateReport,
  isShareModalOpen,
  onCloseShareModal,
}: ScoringModalsProps) {
  return (
    <>
      <ScoringSessionModals
        state={state}
        handlers={handlers}
        derived={derived}
        match={match}
        setSummaryModalState={setSummaryModalState}
        onCloseSetSummary={onCloseSetSummary}
        onNavigateReport={onNavigateReport}
      />

      <ScoringEditScoreModal
        state={state}
        handlers={handlers}
        derived={derived}
        match={match}
        cameFromDashboard={cameFromDashboard}
        onNavigateDashboard={onNavigateDashboard}
      />

      {state.activeModal === "point-details" && (
        <PointDetailsModalBlock state={state} handlers={handlers} derived={derived} match={match} />
      )}

      {isShareModalOpen && (
        <ShareSpectateModal
          matchId={matchId}
          isOpen={isShareModalOpen}
          onClose={onCloseShareModal ?? (() => {})}
        />
      )}
    </>
  );
}
