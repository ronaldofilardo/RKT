"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MatchHeader } from "@/components/scoring/MatchHeader";
import { ActionBar } from "@/components/scoring/ActionBar";
import { AnnotationSessionPanel } from "@/components/scoring/AnnotationSessionPanel";
import {
  computeLiveCounters,
  detectTacticalTrends,
} from "@/core/scoring/live-tactical-insights";
import { useScoringPageState } from "./useScoringPageState";
import { useScoringPageEffects } from "./useScoringPageEffects";
import { useScoringPageDerived } from "./useScoringPageDerived";
import { ScoringTimelineView } from "./ScoringTimelineView";
import { ScoringPlayArea } from "./ScoringPlayArea";
import { ScoringModals } from "./ScoringModals";

function ScoringPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = params.id as string;

  // Se o usuário veio de "Editar Placar" no Dashboard, a URL tem ?modal=edit-score
  // (handleMatchClick em useDashboardPageActions.ts). Usar ref para capturar
  // apenas o valor inicial e não reagir a mudanças de URL posteriores.
  const cameFromDashboardRef = useRef(searchParams.get("modal") === "edit-score");

  // BUG FIX (2026-09-27): a timeline em /scoring é alimentada por
  // engineRef.current.getPointHistory() (histórico do engine em memória),
  // que podia estar incompleto/colapsado (ex.: só o último ponto) até um
  // fetchMatch(true) trazer o histórico completo do servidor — a timeline
  // abria "cortada" e só se completava sozinha depois de um tempo. Agora
  // forçamos um fetchMatch(true) ANTES de trocar para a view de timeline,
  // com um popup de carregamento enquanto isso, para garantir que ela
  // sempre abra já completa.
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  const state = useScoringPageState(matchId);
  const handlers = useScoringPageEffects(state);
  const derived = useScoringPageDerived(state, handlers);

  const liveCounters = useMemo(
    () => computeLiveCounters(derived.timelinePoints),
    [derived.timelinePoints]
  );

  const currentSetNumber = derived.effectiveScoreState?.sets?.length || 1;

  const tacticalInsights = useMemo(
    () =>
      detectTacticalTrends(
        derived.timelinePoints,
        state.match?.player1?.name ?? "Jogador 1",
        state.match?.player2?.name ?? "Jogador 2",
        currentSetNumber
      ),
    [
      derived.timelinePoints,
      state.match?.player1?.name,
      state.match?.player2?.name,
      currentSetNumber,
    ]
  );

  const [setSummaryModalState, setSetSummaryModalState] = useState<{
    isOpen: boolean;
    setNumber: number;
  }>({ isOpen: false, setNumber: 1 });
  const completedSetsCountRef = useRef<number>(
    derived.editScoreCompletedSets?.length ?? 0
  );

  useEffect(() => {
    const currentCompleted = derived.editScoreCompletedSets?.length ?? 0;
    if (
      currentCompleted > completedSetsCountRef.current &&
      currentCompleted > 0
    ) {
      setSetSummaryModalState({
        isOpen: true,
        setNumber: currentCompleted,
      });
    }
    completedSetsCountRef.current = currentCompleted;
  }, [derived.editScoreCompletedSets?.length]);

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
    pointsHistory,
    suspendedSession,
    sessionIdRef,
    sessionActive,
    elapsed,
    serveErrorState,
    setViewMode,
    setFontScale,
  } = state;

  const {
    fetchMatch,
    handleVoltar,
    openAceModal,
    handleAceDirect,
    handleServeErrorDirect,
    handlePointFromCard,
    handleServeErrorWithModal,
    abandonCurrentSession,
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
    isSetupNeeded,
    isProcessingPoint,
    timelinePoints,
  } = derived;

  const handleOpenTimeline = async () => {
    if (isTimelineLoading) return;
    setIsTimelineLoading(true);
    try {
      await fetchMatch(true);
      await state.fetchTimelinePoints();
    } finally {
      setViewMode("timeline");
      setIsTimelineLoading(false);
    }
  };

  if (viewMode === "timeline" && !isSetupNeeded && activeModal === null) {
    return (
      <ScoringTimelineView
        fontScale={fontScale}
        elapsed={elapsed}
        isFinished={isFinished}
        abandonCurrentSession={abandonCurrentSession}
        onCloseTimeline={() => setViewMode("scoring")}
        matchId={matchId}
        timelinePoints={timelinePoints}
        player1Name={match.player1.name}
        player2Name={match.player2.name}
        comments={state.comments}
        onNavigateReport={() => router.push(`/match/${matchId}/report`)}
        onNavigateDashboard={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-telemetry-base flex flex-col"
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
        onTimeline={handleOpenTimeline}
        isFinished={isFinished}
      />

      {isTimelineLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-telemetry-card border border-white/10 rounded-2xl px-6 py-5 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
            <p className="text-sm text-telemetry-text-primary font-medium">
              Carregando linha do tempo completa...
            </p>
          </div>
        </div>
      )}

      <ScoringPlayArea
        match={match}
        effectiveScoreState={effectiveScoreState}
        suspendedSession={suspendedSession}
        liveCounters={liveCounters}
        tacticalInsights={tacticalInsights}
        completedSetsCount={derived.editScoreCompletedSets?.length ?? 0}
        p1IsServing={p1IsServing}
        p2IsServing={p2IsServing}
        isSetPoint={isSetPoint}
        isBreakPoint={isBreakPoint}
        isMatchPoint={isMatchPoint}
        isTiebreak={isTiebreak}
        isSuperTiebreak={isSuperTiebreak}
        winner={winner}
        pointsHistory={pointsHistory}
        scoreState={scoreState}
        isFinished={isFinished}
        matchId={matchId}
        onOpenSetSummary={() =>
          setSetSummaryModalState({
            isOpen: true,
            setNumber: derived.editScoreCompletedSets?.length || 1,
          })
        }
        onPoint={handlePointFromCard}
        onSwipeUndo={() => state.open("undo")}
        onNavigateReport={() => router.push(`/match/${matchId}/report`)}
        onRegisterAndExit={async () => {
          if (isFinished) {
            await abandonCurrentSession();
          }
          router.push("/dashboard");
        }}
      />

      <ActionBar
        secondServe={false}
        serveStep={serveErrorState.serveStep}
        canUndo={canUndo}
        canEdit={!isFinished}
        fontScale={fontScale}
        isFinished={isFinished}
        isProcessing={isProcessingPoint}
        onAceDirect={handleAceDirect}
        onAceWithDetails={openAceModal}
        onOut={(step) => handleServeErrorWithModal("out", step)}
        onNet={(step) => handleServeErrorWithModal("net", step)}
        onOutDirect={(step) => handleServeErrorDirect("out", step)}
        onNetDirect={(step) => handleServeErrorDirect("net", step)}
        onVoltar={handleVoltar}
        onFontSmaller={() => setFontScale((f) => Math.max(0.6, f - 0.1))}
        onFontBigger={() => setFontScale((f) => Math.min(2, f + 0.1))}
        onEditScore={() => state.open("edit-score")}
        onComment={
          process.env.NEXT_PUBLIC_COMMENT_FEATURE === "true"
            ? () => state.open("comment")
            : undefined
        }
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

      <ScoringModals
        state={state}
        handlers={handlers}
        derived={derived}
        match={match}
        matchId={matchId}
        cameFromDashboard={cameFromDashboardRef.current}
        setSummaryModalState={setSummaryModalState}
        onCloseSetSummary={() =>
          setSetSummaryModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onNavigateDashboard={() => router.push("/dashboard")}
        onNavigateReport={() => router.push(`/match/${matchId}/report`)}
      />
    </div>
  );
}

// useSearchParams requer Suspense boundary no Next.js App Router (App Dir).
// Envolvemos ScoringPageInner para satisfazer esse requisito sem alterar a
// estrutura do componente principal.
export default function ScoringPage() {
  return (
    <Suspense>
      <ScoringPageInner />
    </Suspense>
  );
}
