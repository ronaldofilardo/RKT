"use client";

import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import type { ScoringPageDerived } from "./useScoringPageDerived";
import { ScoringEditScoreModal } from "./scoring-edit-score-modal";
import { ScoringSessionModals } from "./scoring-session-modals";
import { ServeEffectModalBlock, PointDetailsModalBlock } from "./scoring-point-modals";

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
}

export function ScoringModals({
  state,
  handlers,
  derived,
  match,
  cameFromDashboard,
  setSummaryModalState,
  onCloseSetSummary,
  onNavigateDashboard,
  onNavigateReport,
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

      {state.activeModal === "serve-effect" && (
        <ServeEffectModalBlock state={state} handlers={handlers} derived={derived} />
      )}

      {state.activeModal === "point-details" && (
        <PointDetailsModalBlock state={state} handlers={handlers} derived={derived} match={match} />
      )}
    </>
  );
}
