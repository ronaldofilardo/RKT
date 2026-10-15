"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/components/Toast";
import { useSession } from "@/contexts/SessionContext";
import { logger } from "@/lib/logger";
import { ensureAuthCookie, clearRedirectingFlag } from "@/lib/auth-client";
import {
  useDashboardNavigation,
  useDashboardData,
  useModalState,
  useUserAuth,
  useDashboardMatchFilters,
} from "./dashboard.hooks";
import { useResumeSession } from "./dashboard.resume";
import { useDeleteMatch, useFinishMatch } from "./dashboard.actions";
import { useDashboardMatchActions } from "./use-dashboard-match-actions";
import { useDashboardSetSummary } from "./use-dashboard-set-summary";
import { DashboardChrome } from "./components/DashboardChrome";
import { DashboardViewRouter } from "./components/DashboardViewRouter";
import { ServerSelectionModal } from "@/app/match/new/components/ServerSelectionModal";
import { SetSummaryModal } from "@/components/scoring/SetSummaryModal";
import { EditMatchInfoModal } from "@/components/dashboard/EditMatchInfoModal";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setSession, setPendingEdit } = useSession();

  logger.info("[DashboardPage] mount pathname=", pathname, "menuOpen=", false);

  useEffect(() => {
    logger.info("[DashboardPage] pathname changed to", pathname);
    clearRedirectingFlag();
    ensureAuthCookie();
  }, [pathname]);

  const { user } = useUserAuth(router);
  const { handleNavigate } = useDashboardNavigation(router);
  const { matches, suspendedFromApi, loading, fetchDashboardData } = useDashboardData(router);
  const { matchToDelete, setMatchToDelete, matchToFinish, setMatchToFinish } = useModalState();

  const { handleResumeSuspended } = useResumeSession({
    router,
    setSession,
    setPendingEdit,
  });

  const { confirmDeleteMatch } = useDeleteMatch({
    matchToDelete,
    fetchDashboardData,
    toast,
  });

  useFinishMatch({
    matchToFinish,
    fetchDashboardData,
    toast,
  });

  const view: "dashboard" | "annotated" | "live" | "pending" | "history" =
    pathname?.startsWith("/partidasanotadas")
      ? "annotated"
      : pathname?.startsWith("/partidasaovivo")
        ? "live"
        : pathname?.startsWith("/aguardandoanotador")
          ? "pending"
          : pathname?.startsWith("/historico")
            ? "history"
            : "dashboard";

  const filters = useDashboardMatchFilters(matches, suspendedFromApi);

  const {
    selectedMatchForServer,
    setSelectedMatchForServer,
    startingMatch,
    matchToEditInfo,
    setMatchToEditInfo,
    handleMatchClick,
    handleMatchResume,
    handleMatchEditScore,
    handleSelectServer,
    handleMatchReport,
    handleMatchFinish,
    handleMatchEditInfo,
    handleMatchDelete,
  } = useDashboardMatchActions({
    router,
    handleResumeSuspended,
    setMatchToDelete,
    setMatchToFinish,
  });

  const {
    setSummaryMatch,
    setSetSummaryMatch,
    setSummaryTimelinePoints,
    handleMatchSetSummary,
    completedSetsCount,
    completedSetsData,
  } = useDashboardSetSummary();

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <DashboardChrome user={user} handleNavigate={handleNavigate} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <DashboardViewRouter
          view={view}
          loading={loading}
          {...filters}
          suspendedFromApi={suspendedFromApi}
          handleNavigate={handleNavigate}
          handleMatchClick={handleMatchClick}
          handleMatchReport={handleMatchReport}
          handleMatchFinish={handleMatchFinish}
          handleMatchDelete={handleMatchDelete}
          handleMatchEditScore={handleMatchEditScore}
          handleMatchResume={handleMatchResume}
          handleMatchSetSummary={handleMatchSetSummary}
          handleMatchEditInfo={handleMatchEditInfo}
        />
      </main>

      {matchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMatchToDelete(null)}
            aria-hidden="true"
          />
          <div className="relative bg-telemetry-card rounded-lg p-6 max-w-sm border border-white/10">
            <h3 className="font-bold mb-2 text-telemetry-text-primary">Excluir partida?</h3>
            <p className="text-sm text-telemetry-text-muted mb-4">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMatchToDelete(null)}
                className="flex-1 py-2 rounded-lg bg-telemetry-elevated hover:bg-telemetry-active text-telemetry-text-primary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDeleteMatch("hard");
                  setMatchToDelete(null);
                }}
                className="flex-1 py-2 rounded-lg bg-telemetry-error hover:bg-red-500 text-white transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}



      {selectedMatchForServer && (
        <ServerSelectionModal
          isOpen={!!selectedMatchForServer}
          selectedP1={selectedMatchForServer.player1}
          selectedP2={selectedMatchForServer.player2}
          startingMatch={startingMatch}
          onSelectServer={handleSelectServer}
          onClose={() => setSelectedMatchForServer(null)}
        />
      )}

      {setSummaryMatch && (
        <SetSummaryModal
          isOpen={Boolean(setSummaryMatch)}
          onClose={() => setSetSummaryMatch(null)}
          onResumeMatch={() => {
            const m = setSummaryMatch;
            setSetSummaryMatch(null);
            handleMatchResume(m);
          }}
          timelinePoints={setSummaryTimelinePoints}
          player1Name={setSummaryMatch.player1?.name ?? "Jogador 1"}
          player2Name={setSummaryMatch.player2?.name ?? "Jogador 2"}
          initialSetNumber={completedSetsCount || 1}
          completedSetsCount={completedSetsCount}
          isMatchFinished={setSummaryMatch.state === "FINISHED"}
          completedSetsData={completedSetsData}
        />
      )}

      {matchToEditInfo && (
        <EditMatchInfoModal
          match={matchToEditInfo}
          onClose={() => setMatchToEditInfo(null)}
          onSuccess={() => {
            fetchDashboardData();
            setMatchToEditInfo(null);
          }}
        />
      )}
    </div>
  );
}