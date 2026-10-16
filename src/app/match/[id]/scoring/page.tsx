"use client";

import React, { useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useScoringPageState } from "./useScoringPageState";
import { useScoringPageEffects } from "./useScoringPageEffects";
import { useScoringPageDerived } from "./useScoringPageDerived";
import { useScoringPageChrome } from "./use-scoring-page-chrome";
import { ScoringTimelineView } from "./ScoringTimelineView";
import { ScoringPageLayout } from "./scoring-page-layout";
import { ErrorScreen, LoadingScreen } from "./scoring-page-screens";

function ScoringPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = params.id as string;

  // Se o usuário veio de "Editar Placar" no Dashboard, a URL tem ?modal=edit-score
  // (openMatchDetails em useDashboardPageActions.ts). Usar ref para capturar
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
  const state = useScoringPageState(matchId);
  const handlers = useScoringPageEffects(state);
  const derived = useScoringPageDerived(state, handlers);
  const chrome = useScoringPageChrome(state, handlers, derived);

  if (state.isLoading) return <LoadingScreen />;

  if (state.error || !state.match) {
    return (
      <ErrorScreen
        message={state.error || "Partida não encontrada"}
        onBack={() => router.push("/dashboard")}
      />
    );
  }

  const { match, fontScale, viewMode, activeModal, setViewMode } = state;
  const { abandonCurrentSession } = handlers;
  const { isFinished, isSetupNeeded, timelinePoints } = derived;

  if (viewMode === "timeline" && !isSetupNeeded && activeModal === null) {
    return (
      <ScoringTimelineView
        fontScale={fontScale}
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
    <ScoringPageLayout
      state={state}
      handlers={handlers}
      derived={derived}
      chrome={chrome}
      match={match}
      matchId={matchId}
      cameFromDashboard={cameFromDashboardRef.current}
      router={router}
    />
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
