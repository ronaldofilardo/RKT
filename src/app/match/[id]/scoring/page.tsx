"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { SetEditData } from "@/components/scoring/editScoreHelpers";
import { MatchHeader } from "@/components/scoring/MatchHeader";
import { PlayerCard } from "@/components/scoring/PlayerCard";
import { VSIndicator } from "@/components/scoring/VSIndicator";
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
import { enrichPointsFromHistory } from "@/components/scoring/timeline-utils";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useOfflineMatchSync } from "@/hooks/useOfflineMatchSync";
import { AnnotationSessionPanel } from "@/components/scoring/AnnotationSessionPanel";
import { useScoreboardUIState } from "@/hooks/useScoreboardUIState";
import { useModalStack } from "@/hooks/useModalStack";
import {
  isSetCompleted,
  checkMatchPoint,
  checkSetPoint,
  checkBreakPoint,
} from "./scoringHelpers";
import { useScoringHandlers } from "@/hooks/useScoringHandlers";
import type { MatchData } from "@/hooks/useScoringHandlers";
import { useSessionManager } from "@/hooks/useSessionManager";
import type { SuspendedSessionState } from "@/hooks/useSessionManager";
import { useSession, useSessionForMatch } from "@/contexts/SessionContext";

export default function ScoringPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const { enqueue, isOnline } = useOfflineSync();
  const { syncPendingMatches } = useOfflineMatchSync();

  // Tentar sincronizar partidas pendentes quando estiver online
  useEffect(() => {
    if (isOnline) {
      syncPendingMatches();
    }
  }, [isOnline, syncPendingMatches]);

  const [match, setMatch] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<ScoringEngine | null>(null);
  const [scoreState, setScoreState] = useState<ScoringState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [setupLoading, setSetupLoading] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [pointsHistory, setPointsHistory] = useState<string[]>([]);
  const [showFinishedBanner, setShowFinishedBanner] = useState(false);
  const {
    state: serveErrorState,
    handleServeErrorOpen,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    setServeStep,
  } = useScoreboardUIState();

  const pointSequenceRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const [suspendedSession, setSuspendedSession] =
    useState<SuspendedSessionState | null>(null);
  const [pendingEditScore, setPendingEditScore] = useState<{
    scoreState: ScoringState;
    floorSets: { player1: number; player2: number } | null;
  } | null>(null);
  const [floorCurrentSets, setFloorCurrentSets] = useState<{
    player1: number;
    player2: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"scoring" | "timeline">("scoring");
  const [undoTimestamp, setUndoTimestamp] = useState<number | null>(null);
  const isProcessingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokenRef = useRef<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const { activeModal, modalParams, open, replace, close, closeAll } =
    useModalStack({ mode: 'internal' });
  const { session, restoreFromSessionStorage, clearPendingEdit, updateScore } = useSession();
  const modalParamsRef = useRef(modalParams);
  modalParamsRef.current = modalParams;
  const openRef = useRef(open);
  openRef.current = open;

  const matchIdRef = useRef(matchId);
  matchIdRef.current = matchId;

  useEffect(() => {
    tokenRef.current = sessionStorage.getItem("access_token");
  }, []);

const {
    persistState,
    getServerId,
    getWinnerId,
    processPoint,
    fetchMatch,
    handleSetupConfirm,
    handleUndo,
    handleLet,
    handleCancelSecondServe,
    openAceModal,
    openPointDetails,
    handleServerEffectConfirm,
    handleServeErrorConfirm,
    handleServeCancel,
    handleServeErrorCancel,
    handlePointDetailsConfirm,
    isProcessing,
  } = useScoringHandlers({
    matchId,
    match,
    isOnline,
    enqueue,
    engineRef,
    tokenRef,
    modalParamsRef,
    openRef,
    pointSequenceRef,
    serveErrorState,
    setMatch,
    setScoreState,
    setIsLoading,
    setError,
    setSetupLoading,
    setPointsHistory,
    setShowFinishedBanner,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    setServeStep,
    open,
    close,
    closeAll,
    onUndoComplete: () => setUndoTimestamp(Date.now()),
    isProcessingRef,
    debounceTimerRef,
  });

  const { abandonCurrentSession, handleEditScore: originalHandleEditScore } =
    useSessionManager({
      matchId,
      match,
      isLoading,
      engineRef,
      tokenRef,
      sessionIdRef,
      matchIdRef,
      suspendedSession,
      fetchMatch,
      persistState,
      setScoreState,
      setSessionActive,
      setSuspendedSession,
      setFloorCurrentSets,
      setPendingEditScore,
      clearPendingEdit,
      updateScoreContext: updateScore,
      close,
    });

  // Wrapper para handleEditScore com redirecionamento de partida encerrada
  const handleEditScore = useCallback(
    async (setResults: SetEditData[], server: "player1" | "player2") => {
      await originalHandleEditScore(setResults, server);
      // Não redirecionar automaticamente - usuário vê o banner e decide quando navegar
    },
    [originalHandleEditScore, matchId]
  );

  

  const handlePointFromCard = useCallback(
    (winnerSide: "player1" | "player2") => {
      open("point-details", { winner: winnerSide });
    },
    [open],
  );

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  useEffect(() => {
    if (scoreState?.startedAt) {
      timerRef.current = setInterval(
        () => setElapsed((prev) => prev + 1),
        1000,
      );
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scoreState?.startedAt]);

  useEffect(() => {
    if (session.pendingEditScore) {
      setPendingEditScore(session.pendingEditScore);
    }
  }, [session.pendingEditScore]);

  useEffect(() => {
    if (pendingEditScore) {
      setFloorCurrentSets(pendingEditScore.floorSets);
      open("edit-score");
    }
  }, [pendingEditScore, open]);

  // Bloqueio de segurança: Redirecionar se partida já estiver encerrada
  // Removido redirecionamento automático para permitir que usuário veja o banner
  // Usuário pode clicar em "Relatório" ou "Registrar" no banner para navegar

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">
            {error || "Partida não encontrada"}
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

  const effectiveScoreState = pendingEditScore?.scoreState
    ?? session.pendingEditScore?.scoreState
    ?? (undoTimestamp && scoreState ? scoreState : suspendedSession?.bankScoreState)
    ?? scoreState;

  const p1IsServing = effectiveScoreState?.server === "player1";
  const p2IsServing = effectiveScoreState?.server === "player2";
  const isMatchPoint = effectiveScoreState ? checkMatchPoint(effectiveScoreState) : false;
  const isSetPoint = effectiveScoreState && !checkMatchPoint(effectiveScoreState) ? checkSetPoint(effectiveScoreState) : false;
  const isBreakPoint = effectiveScoreState && !checkMatchPoint(effectiveScoreState) && !isSetPoint ? checkBreakPoint(effectiveScoreState) : false;
  const isTiebreak = effectiveScoreState
    ? (effectiveScoreState.sets[effectiveScoreState.sets.length - 1]?.isTiebreak ?? false)
    : false;
  const isSuperTiebreak = match.format === "MATCH_TB_10";
  const isFinished = effectiveScoreState?.isFinished ?? false;
  const winner = effectiveScoreState?.winner;
  const canUndo = engineRef.current
    ? engineRef.current.getHistoryLength() > 0
    : false;
  const isSetupNeeded = activeModal === "setup" && !match.initialServerId;
  const isProcessingPoint = isProcessing === true;

  const gamePointToDisplay = (p: number): string => {
    if (p === 0) return "0";
    if (p === 1) return "15";
    if (p === 2) return "30";
    if (p === 3) return "40";
    if (p === 4) return "AD";
    return String(p);
  };

  const timelinePoints = engineRef.current && match
    ? enrichPointsFromHistory(
        engineRef.current.getPointHistory(),
        match.player1.id,
        match.player2.id,
      )
    : [];

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
      {!isOnline && (
        <div className="bg-amber-600 text-white text-center text-sm py-1 px-4 font-semibold">
          🔴 Modo Offline — sincronizando ao reconectar
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

        <ContextBadges
          isMatchPoint={isMatchPoint}
          isSetPoint={isSetPoint}
          isBreakPoint={isBreakPoint}
          isTiebreak={isTiebreak}
          isSuperTiebreak={isSuperTiebreak}
          pointsHistory={pointsHistory}
        />

        <div className="my-2 sm:my-3">
          <ScoreboardCard
            player1={match.player1}
            player2={match.player2}
            scoreState={effectiveScoreState}
            isSuspended={!!suspendedSession}
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
              onSwipeDown={() => open("undo")}
              disabled={isFinished}
            />
          </div>

          <div className="w-10 sm:w-14 flex-shrink-0">
            <VSIndicator scoreState={effectiveScoreState} />
          </div>

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
              onSwipeDown={() => open("undo")}
              disabled={isFinished}
            />
          </div>
        </div>

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
        canEdit={false}
        fontScale={fontScale}
        isFinished={isFinished}
        isProcessing={isProcessingPoint}
        onAce={openAceModal}
        onOut={(step) => {
          if (isProcessingPoint) return;
          handleServeErrorOpen("out", step);
          open("serve-effect", {
            context: "error",
            serveStep: step,
            errorType: "out",
          });
        }}
        onNet={(step) => {
          if (isProcessingPoint) return;
          handleServeErrorOpen("net", step);
          open("serve-effect", {
            context: "error",
            serveStep: step,
            errorType: "net",
          });
        }}
        onCancelSecondServe={handleCancelSecondServe}
        onServeCancel={handleServeCancel}
        onUndo={() => open("undo")}
        onFontSmaller={() => setFontScale((f) => Math.max(0.6, f - 0.1))}
        onFontBigger={() => setFontScale((f) => Math.min(2, f + 0.1))}
        onEditScore={() => open("edit-score")}
      />

      {sessionIdRef.current && (
        <AnnotationSessionPanel
          sessionId={sessionIdRef.current}
          matchId={matchId}
          isActive={sessionActive}
          onStart={() => setSessionActive(true)}
          onPause={() => setSessionActive(false)}
          onEnd={() => {
            abandonCurrentSession();
            setSessionActive(false);
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
          onCancel={close}
          loading={false}
        />
      )}

      {activeModal === "edit-score" && effectiveScoreState && (
        <EditScoreModal
          isOpen={true}
          matchFormat={match.format as any}
          playerNames={{ p1: match.player1.name, p2: match.player2.name }}
          currentSets={(() => {
            const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
            if (!lastSet) return { player1: 0, player2: 0 };
            const lastSetIsCompleted = isSetCompleted(lastSet, match.format as any);
            
            // Para Match Tie-Break, usar os pontos do tiebreakScore em vez de player1/player2
            if (lastSet.isTiebreak && lastSet.tiebreakScore) {
              const tiebreakSets = {
                player1: lastSet.tiebreakScore.player1,
                player2: lastSet.tiebreakScore.player2,
              };
              console.log("[EditScoreModal] currentSets for Match Tie-Break:", tiebreakSets);
              return tiebreakSets;
            }
            
            return lastSetIsCompleted ? { player1: 0, player2: 0 } : { player1: lastSet.player1, player2: lastSet.player2 };
          })()}
          currentServer={effectiveScoreState.server}
          completedSets={effectiveScoreState.sets
            .filter((s) => isSetCompleted(s))
            .map((s) => ({
              games: { player1: s.player1, player2: s.player2 } as Record<
                "player1" | "player2",
                number
              >,
              winner: (s.player1 > s.player2 ? "player1" : "player2") as
                | "player1"
                | "player2",
            }))}
          currentGamePoints={{
            player1: gamePointToDisplay(
              effectiveScoreState.currentGame?.player1 ?? 0,
            ),
            player2: gamePointToDisplay(
              effectiveScoreState.currentGame?.player2 ?? 0,
            ),
          }}
          floorCurrentSets={floorCurrentSets}
          suspendedSession={suspendedSession}
          onConfirm={handleEditScore}
          onCancel={() => {
            setPendingEditScore(null);
            clearPendingEdit();
            close();
          }}
          onMatchFinished={(winner) => {
            // Não redirecionar automaticamente - usuário vê o banner e decide quando navegar
          }}
          onRefreshFloor={async () => {
            // CORREÇÃO #2: Buscar floor atualizado do banco antes de confirmar
            if (!engineRef.current || !match) return null;
            const state = engineRef.current.getState();
            const lastSet = state.sets[state.sets.length - 1];
            if (!lastSet) return null;
            return { player1: lastSet.player1, player2: lastSet.player2 };
          }}
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
          winnerName={
            modalParams.context === "winner"
              ? scoreState?.server === "player1"
                ? match.player1.name
                : match.player2.name
              : scoreState?.server === "player1"
                ? match.player2.name
                : match.player1.name
          }
          fontScale={fontScale}
          onConfirm={
            modalParams.context === "winner"
              ? handleServerEffectConfirm
              : handleServeErrorConfirm
          }
          onCancel={handleServeErrorCancel}
          onLet={handleLet}
          showLetOption={modalParams.context === "winner" && match.includeLet === true}
        />
      )}

      {activeModal === "point-details" && (
        <PointDetailsModal
          winnerPlayerSide={
            (modalParams.winner as "player1" | "player2") ?? "player1"
          }
          currentServer={scoreState?.server ?? "player1"}
          player1Name={match.player1.name}
          player2Name={match.player2.name}
          fontScale={fontScale}
          onConfirm={handlePointDetailsConfirm}
          onCancel={close}
        />
      )}
    </div>
  );
}
