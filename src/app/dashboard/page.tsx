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
import { DashboardMatchModals } from "./components/DashboardMatchModals";

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

      <DashboardMatchModals
        matchToDelete={matchToDelete}
        onCancelDelete={() => setMatchToDelete(null)}
        onConfirmDelete={() => {
          confirmDeleteMatch("hard");
          setMatchToDelete(null);
        }}
        serverMatch={selectedMatchForServer}
        startingMatch={startingMatch}
        onSelectServer={handleSelectServer}
        onCloseServer={() => setSelectedMatchForServer(null)}
        setSummaryMatch={setSummaryMatch}
        setSummaryTimelinePoints={setSummaryTimelinePoints}
        completedSetsCount={completedSetsCount}
        completedSetsData={completedSetsData}
        onCloseSetSummary={() => setSetSummaryMatch(null)}
        onResumeSetSummary={() => {
          if (!setSummaryMatch) return;
          const m = setSummaryMatch;
          setSetSummaryMatch(null);
          handleMatchResume(m);
        }}
        editMatch={matchToEditInfo}
        onCloseEditInfo={() => setMatchToEditInfo(null)}
        onSuccessEditInfo={() => {
          fetchDashboardData();
          setMatchToEditInfo(null);
        }}
      />
    </div>
  );
}