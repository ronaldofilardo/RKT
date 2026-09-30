"use client";

import React from "react";
import type { TennisFormat } from "@/core/scoring/types";
import { SetupModal } from "@/components/scoring/SetupModal";
import { UndoConfirmModal } from "@/components/scoring/UndoConfirmModal";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";
import { ServerEffectModal } from "@/components/scoring/ServerEffectModal";
import { PointDetailsModal } from "@/components/scoring/PointDetailsModal";
import { CommentModal } from "@/components/scoring/CommentModal";
import { SetSummaryModal } from "@/components/scoring/SetSummaryModal";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import type { ScoringPageDerived } from "./useScoringPageDerived";

export interface ScoringModalsProps {
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
  const {
    activeModal,
    modalParams,
    setupLoading,
    fontScale,
    floorCurrentSets,
    suspendedSession,
  } = state;

  const {
    handleSetupConfirm,
    handleUndo,
    handleEditScore,
    handleEditScoreCancel,
    handleEditScoreRefreshFloor,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    handleCommentCreate,
  } = handlers;

  const {
    effectiveScoreState,
    isTiebreak,
    gamePointToDisplay,
    editScoreCurrentSets,
    editScoreCompletedSets,
    serverEffectWinnerName,
    timelinePoints,
    isFinished,
  } = derived;

  return (
    <>
      {activeModal === "setup" && !match.initialServerId && (
        <SetupModal
          player1={match.player1}
          player2={match.player2}
          onSelectServer={handleSetupConfirm}
          loading={setupLoading}
        />
      )}

      {activeModal === "undo" && (
        <UndoConfirmModal
          onConfirm={handleUndo}
          onCancel={state.close}
          loading={false}
        />
      )}

      {activeModal === "edit-score" && effectiveScoreState && (
        <EditScoreModal
          isOpen={true}
          matchFormat={match.format as TennisFormat}
          playerNames={{ p1: match.player1.name, p2: match.player2.name }}
          currentSets={editScoreCurrentSets}
          currentServer={effectiveScoreState.server}
          initialServer={
            match.initialServerId === match.player1.id ? "player1" : "player2"
          }
          completedSets={editScoreCompletedSets}
          currentGamePoints={{
            player1: isTiebreak
              ? (effectiveScoreState.sets[effectiveScoreState.sets.length - 1]
                  ?.tiebreakScore?.player1 ?? 0)
              : gamePointToDisplay(
                  effectiveScoreState.currentGame?.player1 ?? 0,
                ),
            player2: isTiebreak
              ? (effectiveScoreState.sets[effectiveScoreState.sets.length - 1]
                  ?.tiebreakScore?.player2 ?? 0)
              : gamePointToDisplay(
                  effectiveScoreState.currentGame?.player2 ?? 0,
                ),
          }}
          isTiebreak={isTiebreak}
          floorCurrentSets={floorCurrentSets}
          suspendedSession={suspendedSession}
          onConfirm={handleEditScore}
          onCancel={() => {
            handleEditScoreCancel();
            if (cameFromDashboard) {
              onNavigateDashboard();
            }
          }}
          onMatchFinished={(_winner) => {
            // Não redirecionar automaticamente - usuário vê o banner e decide quando navegar
          }}
          onRefreshFloor={handleEditScoreRefreshFloor}
        />
      )}

      {activeModal === "serve-effect" && (
        <ServerEffectModal
          context={modalParams.context === "winner" ? "winner" : "error"}
          serveStep={
            (modalParams.serveStep === "second" ? "second" : "first") as
              | "first"
              | "second"
          }
          errorType={modalParams.errorType as "out" | "net" | undefined}
          winnerName={serverEffectWinnerName}
          fontScale={fontScale}
          onConfirm={
            modalParams.context === "winner"
              ? handleServerEffectConfirm
              : handleServeErrorConfirm
          }
          onCancel={handleServeErrorCancel}
        />
      )}

      {activeModal === "point-details" && (
        <PointDetailsModal
          winnerPlayerSide={
            (modalParams.winner as "player1" | "player2") ?? "player1"
          }
          currentServer={effectiveScoreState?.server ?? "player1"}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          fontScale={fontScale}
          onConfirm={handlePointDetailsConfirm}
          onCancel={state.close}
        />
      )}

      {activeModal === "comment" &&
        process.env.NEXT_PUBLIC_COMMENT_FEATURE === "true" && (
          <CommentModal
            isOpen={true}
            onClose={state.closeAll}
            onSave={handleCommentCreate}
          />
        )}

      <SetSummaryModal
        isOpen={setSummaryModalState.isOpen}
        onClose={onCloseSetSummary}
        timelinePoints={timelinePoints}
        player1Name={match.player1.name}
        player2Name={match.player2.name}
        initialSetNumber={setSummaryModalState.setNumber}
        completedSetsCount={editScoreCompletedSets?.length ?? 0}
        completedSetsData={editScoreCompletedSets}
        isMatchFinished={isFinished}
        onViewReport={onNavigateReport}
      />
    </>
  );
}
