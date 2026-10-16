"use client";

import { ServerEffectModal } from "@/components/scoring/ServerEffectModal";
import { PointDetailsModal } from "@/components/scoring/PointDetailsModal";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import type { ScoringPageDerived } from "./useScoringPageDerived";
import { ScoringEditScoreModal } from "./scoring-edit-score-modal";
import { ScoringSessionModals } from "./scoring-session-modals";

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
        <ServerEffectModal
          context={state.modalParams.context === "winner" ? "winner" : "error"}
          serveStep={
            (state.modalParams.serveStep === "second" ? "second" : "first") as
              | "first"
              | "second"
          }
          errorType={state.modalParams.errorType as "out" | "net" | undefined}
          winnerName={derived.serverEffectWinnerName}
          fontScale={state.fontScale}
          onConfirm={
            state.modalParams.context === "winner"
              ? handlers.handleServerEffectConfirm
              : handlers.handleServeErrorConfirm
          }
          onCancel={handlers.handleServeErrorCancel}
        />
      )}

      {state.activeModal === "point-details" && (
        <PointDetailsModal
          winnerPlayerSide={
            (state.modalParams.winner as "player1" | "player2") ?? "player1"
          }
          currentServer={derived.effectiveScoreState?.server ?? "player1"}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          fontScale={state.fontScale}
          onConfirm={handlers.handlePointDetailsConfirm}
          onCancel={state.close}
        />
      )}
    </>
  );
}
