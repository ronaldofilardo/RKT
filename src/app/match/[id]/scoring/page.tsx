"use client";

import { useParams, useRouter } from "next/navigation";
import type { TennisFormat } from "@/core/scoring/types";
import { MatchHeader } from "@/components/scoring/MatchHeader";
import { PlayerCard } from "@/components/scoring/PlayerCard";
import { ContextBadges } from "@/components/scoring/ContextBadges";
import { ScoreboardCard } from "@/components/scoring/ScoreboardCard";
import { ActionBar } from "@/components/scoring/ActionBar";
import { SetupModal } from "@/components/scoring/SetupModal";
import { UndoConfirmModal } from "@/components/scoring/UndoConfirmModal";
import { PointDetailsModal } from "@/components/scoring/PointDetailsModal";
import { ServerEffectModal } from "@/components/scoring/ServerEffectModal";
import { EditScoreModal } from "@/components/scoring/EditScoreModal";
import { MatchTimelineView } from "@/components/scoring/MatchTimelineView";
import CourtBackground from "@/components/scoring/CourtBackground";
import { AnnotationSessionPanel } from "@/components/scoring/AnnotationSessionPanel";
import { useScoringPageState } from "./useScoringPageState";
import { useScoringPageEffects } from "./useScoringPageEffects";
import { useScoringPageDerived } from "./useScoringPageDerived";

export default function ScoringPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;

  const state = useScoringPageState(matchId);
  const handlers = useScoringPageEffects(state);
  const derived = useScoringPageDerived(state, handlers);

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (state.error || !state.match) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">
            {state.error || "Partida não encontrada"}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-sky-600 underline"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  const {
    match,
    scoreState,
    fontScale,
    viewMode,
    activeModal,
    modalParams,
    pointsHistory,
    suspendedSession,
    sessionIdRef,
    sessionActive,
    elapsed,
    setupLoading,
    serveErrorState,
    setViewMode,
    setFontScale,
  } = state;

  const {
    handleUndo,
    handleRedo,
    handleCancelSecondServe,
    openAceModal,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeCancel,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    handlePointFromCard,
    handleServeErrorWithModal,
    handleEditScoreCancel,
    handleEditScoreRefreshFloor,
    abandonCurrentSession,
    handleEditScore,
    handleSetupConfirm,
  } = handlers;

  const {
    effectiveScoreState,
    p1IsServing,
    p2IsServing,
    isMatchPoint,
    isSetPoint,
    isBreakPoint,
    isTiebreak,
    isSuperTiebreak,
    isFinished,
    winner,
    canUndo,
    canRedo,
    isSetupNeeded,
    isProcessingPoint,
    gamePointToDisplay,
    timelinePoints,
    editScoreCurrentSets,
    editScoreCompletedSets,
    serverEffectWinnerName,
  } = derived;

  if (viewMode === "timeline" && !isSetupNeeded && activeModal === null) {
    return (
      <div
        className="min-h-screen bg-gray-900 flex flex-col"
        style={{ fontSize: `${fontScale * 100}%` }}
      >
        <MatchHeader
          elapsedSeconds={elapsed}
          onClose={async () => {
            await abandonCurrentSession();
            router.push("/dashboard");
          }}
          onTimeline={() => setViewMode("scoring")}
          isFinished={isFinished}
        />
        <div className="flex-1 flex flex-col px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMode("scoring")}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-sm"
            >
              ← Placar
            </button>
            <span className="text-xs text-gray-400">
              {timelinePoints.length} pontos
            </span>
            <button
              onClick={() => router.push(`/match/${matchId}/report`)}
              className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg text-sm"
            >
              Relatório →
            </button>
          </div>
          <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 p-4 overflow-hidden">
            <MatchTimelineView
              points={timelinePoints}
              player1Name={match.player1.name}
              player2Name={match.player2.name}
              matchId={matchId}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-900 flex flex-col"
      style={{ fontSize: `${fontScale * 100}%` }}
    >
      {state.syncStatus !== "synced" && (
        <div
          data-testid="sync-status"
          data-sync-state={state.syncStatus}
          role="status"
          aria-live="polite"
          className={`text-white text-center text-sm py-1 px-4 font-semibold ${
            state.syncStatus === "offline" ? "bg-amber-600" : "bg-blue-600"
          }`}
        >
          {state.syncStatus === "offline"
            ? "🔴 Modo Offline — sincronizando ao reconectar"
            : "🔄 Sincronizando pontos pendentes..."}
        </div>
      )}

      <MatchHeader
        elapsedSeconds={elapsed}
        onClose={async () => {
          await abandonCurrentSession();
          router.push("/dashboard");
        }}
        onTimeline={() => setViewMode("timeline")}
        isFinished={isFinished}
      />

      <div className="flex-1 flex flex-col gap-0 sm:gap-1 px-2 sm:px-3 py-1 sm:py-2 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <CourtBackground courtType={match.courtType} />
        </div>

        <div className="my-2 sm:my-3">
          <ScoreboardCard
            player1={match.player1}
            player2={match.player2}
            scoreState={effectiveScoreState}
            isSuspended={!!suspendedSession}
            format={match.format as string}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-1 relative z-10 min-h-0">
          <div className="flex-1 min-w-0">
            <PlayerCard
              player={match.player1}
              side="player1"
              scoreState={effectiveScoreState}
              isServing={p1IsServing}
              isSetPoint={isSetPoint}
              isBreakPoint={isBreakPoint}
              isWinner={winner === "player1"}
              onPoint={() => handlePointFromCard("player1")}
              onSwipeDown={() => state.open("undo")}
              disabled={isFinished}
            />
          </div>

          <div className="w-px h-full bg-white/10 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <PlayerCard
              player={match.player2}
              side="player2"
              scoreState={effectiveScoreState}
              isServing={p2IsServing}
              isSetPoint={isSetPoint}
              isBreakPoint={isBreakPoint}
              isWinner={winner === "player2"}
              onPoint={() => handlePointFromCard("player2")}
              onSwipeDown={() => state.open("undo")}
              disabled={isFinished}
            />
          </div>
        </div>

        <ContextBadges
          isMatchPoint={isMatchPoint}
          isSetPoint={isSetPoint}
          isBreakPoint={isBreakPoint}
          isTiebreak={isTiebreak}
          isSuperTiebreak={isSuperTiebreak}
          pointsHistory={pointsHistory}
        />

        {isFinished && (
          <div className="mt-2 sm:mt-3 bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-3 sm:p-5 text-center relative z-10 mx-0">
            <span className="text-2xl sm:text-4xl">🏆</span>
            <h2 className="text-base sm:text-xl font-black text-white mt-1 sm:mt-2">
              PARTIDA FINALIZADA!
            </h2>
            <p className="text-sm sm:text-lg font-bold text-yellow-300 mt-0.5 sm:mt-1">
              VENCEDOR:{" "}
              {winner === "player1" ? match.player1.name : match.player2.name}
            </p>
            <p className="text-[11px] sm:text-sm text-gray-400 mt-0.5 sm:mt-1">
              {scoreState?.setsWon.player1} x {scoreState?.setsWon.player2} sets
            </p>
            <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4 justify-center">
              <button
                onClick={() => router.push(`/match/${matchId}/report`)}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl text-[11px] sm:text-sm min-h-[44px]"
              >
                📊 Relatório
              </button>
              <button
                onClick={async () => {
                  if (isFinished) {
                    await abandonCurrentSession();
                  }
                  router.push("/dashboard");
                }}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-[11px] sm:text-sm border border-white/20 min-h-[44px]"
              >
                ✅ Registrar
              </button>
            </div>
          </div>
        )}
      </div>

      <ActionBar
        secondServe={false}
        serveStep={serveErrorState.serveStep}
        canUndo={canUndo}
        canRedo={canRedo}
        canEdit={!isFinished}
        fontScale={fontScale}
        isFinished={isFinished}
        isProcessing={isProcessingPoint}
        onAce={openAceModal}
        onOut={(step) => handleServeErrorWithModal("out", step)}
        onNet={(step) => handleServeErrorWithModal("net", step)}
        onCancelSecondServe={handleCancelSecondServe}
        onServeCancel={handleServeCancel}
        onUndo={() => state.open("undo")}
        onRedo={() => handleRedo()}
        onFontSmaller={() => setFontScale((f) => Math.max(0.6, f - 0.1))}
        onFontBigger={() => setFontScale((f) => Math.min(2, f + 0.1))}
        onEditScore={() => state.open("edit-score")}
      />

      {sessionIdRef.current && (
        <AnnotationSessionPanel
          sessionId={sessionIdRef.current}
          matchId={matchId}
          isActive={sessionActive}
          onStart={() => state.setSessionActive(true)}
          onPause={() => state.setSessionActive(false)}
          onEnd={async () => {
            await abandonCurrentSession();
            state.setSessionActive(false);
          }}
          annotatorCount={1}
        />
      )}

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
          completedSets={editScoreCompletedSets}
          currentGamePoints={{
            player1: gamePointToDisplay(
              effectiveScoreState.currentGame?.player1 ?? 0,
            ),
            player2: gamePointToDisplay(
              effectiveScoreState.currentGame?.player2 ?? 0,
            ),
          }}
          floorCurrentSets={state.floorCurrentSets}
          suspendedSession={state.suspendedSession}
          onConfirm={handleEditScore}
          onCancel={handleEditScoreCancel}
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
    </div>
  );
}
