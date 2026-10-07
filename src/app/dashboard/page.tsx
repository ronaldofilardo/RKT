"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/components/Toast";
import { useSession } from "@/contexts/SessionContext";
import { logger } from "@/lib/logger";
import { ensureAuthCookie, clearAuthState, clearRedirectingFlag } from "@/lib/auth-client";
import {
  useDashboardNavigation,
  useDashboardData,
  useModalState,
  useUserAuth,
  useDashboardMatchFilters,
} from "./dashboard.hooks";
import { useResumeSession } from "./dashboard.resume";
import { useDeleteMatch, useFinishMatch } from "./dashboard.actions";
import { DashboardTopBar } from "./components/DashboardTopBar";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardViewRouter } from "./components/DashboardViewRouter";
import { ServerSelectionModal } from "@/app/match/new/components/ServerSelectionModal";
import { SetSummaryModal } from "@/components/scoring/SetSummaryModal";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setSession, setPendingEdit } = useSession();
  const [selectedMatchForServer, setSelectedMatchForServer] = useState<any | null>(null);
  const [startingMatch, setStartingMatch] = useState(false);
  const [setSummaryMatch, setSetSummaryMatch] = useState<any | null>(null);
  const [setSummaryTimelinePoints, setSetSummaryTimelinePoints] = useState<any[]>([]);

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

  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleMatchClick = useCallback((match: any) => {
    logger.info("[DashboardPage] match click", match.id, match.state);
    if (match.state === "FINISHED") {
      router.push(`/match/${match.id}/report`);
    } else if (match.suspendedSessionId || match.matchStateSnapshot) {
      handleResumeSuspended(match, { openEditModal: false });
    } else if (match.state === "SCHEDULED" || !match.initialServerId) {
      setSelectedMatchForServer(match);
    } else {
      router.push(`/match/${match.id}/scoring`);
    }
  }, [router, handleResumeSuspended]);

  const handleMatchResume = useCallback((match: any) => {
    logger.info("[DashboardPage] resume match directly", match.id);
    if (match.suspendedSessionId || match.matchStateSnapshot) {
      handleResumeSuspended(match, { openEditModal: false });
    } else {
      router.push(`/match/${match.id}/scoring`);
    }
  }, [router, handleResumeSuspended]);

  const handleMatchEditScore = useCallback((match: any) => {
    logger.info("[DashboardPage] edit score match", match.id);
    if (match.suspendedSessionId || match.matchStateSnapshot) {
      handleResumeSuspended(match, { openEditModal: true });
    } else {
      router.push(`/match/${match.id}/scoring?modal=edit-score`);
    }
  }, [router, handleResumeSuspended]);

  const handleMatchSetSummary = useCallback(async (match: any) => {
    logger.info("[DashboardPage] open set summary", match.id);
    setSetSummaryMatch(match);
    setSetSummaryTimelinePoints([]);
    try {
            const res = await fetch(`/api/matches/${match.id}/report`, {
        headers: {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.timelinePoints)) {
          setSetSummaryTimelinePoints(data.timelinePoints);
        }
      }
    } catch (err) {
      logger.error("[DashboardPage] Erro ao buscar pontos para análise do set", err);
    }
  }, []);

  const completedSetsCount = useMemo(() => {
    if (!setSummaryMatch?.scoreState?.sets) return 1;
    const sets = setSummaryMatch.scoreState.sets;
    const count = sets.filter((s: any) => {
      return (s.player1 >= 6 || s.player2 >= 6) && Math.abs(s.player1 - s.player2) >= 2 || s.isTiebreak || s.tiebreakScore;
    }).length;
    return count || sets.length || 1;
  }, [setSummaryMatch]);

  const completedSetsData = useMemo(() => {
    if (!setSummaryMatch?.scoreState?.sets) return [];
    return setSummaryMatch.scoreState.sets.map((s: any) => ({
      games: { player1: s.player1 ?? 0, player2: s.player2 ?? 0 },
      winner: (s.player1 > s.player2 ? 'player1' : 'player2') as 'player1' | 'player2',
      tiebreakScore: s.tiebreakScore ?? undefined,
    }));
  }, [setSummaryMatch]);

  const handleSelectServer = async (serverId: string) => {
    if (!selectedMatchForServer) return;
    setStartingMatch(true);
    try {
            const response = await fetch(`/api/matches/${selectedMatchForServer.id}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: "IN_PROGRESS",
          initialServerId: serverId,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Erro ao iniciar partida");
      }
      router.push(`/match/${selectedMatchForServer.id}/scoring`);
    } catch (err) {
      logger.error("[DashboardPage handleSelectServer]", err);
      toast({ type: "error", message: "Erro ao iniciar partida" });
      setStartingMatch(false);
    }
  };

  const handleMatchReport = useCallback((match: any) => {
    router.push(`/match/${match.id}/report`);
  }, [router]);

  const handleMatchFinish = useCallback((match: any) => {
    setMatchToFinish(match);
  }, [setMatchToFinish]);

  const handleMatchDelete = useCallback((match: any) => {
    setMatchToDelete(match);
  }, [setMatchToDelete]);

  const handleLogout = useCallback(() => {
    logger.info("[DashboardPage] logout click");
    if (window.confirm("Deseja realmente sair?")) {
      try {
        clearAuthState();
      } catch (err) {
        logger.error("[logout] Erro ao limpar auth state", err);
      }
      router.replace("/login");
    }
  }, [router]);

  const isAdmin = user?.role === "ADMIN";

  const menuItems = [
    { emoji: "🏠", label: "Início", action: () => handleNavigate("dashboard") },
    { emoji: "📜", label: "Histórico", action: () => handleNavigate("history") },
    { emoji: "📝", label: "Partidas Anotadas", action: () => handleNavigate("annotated") },
    { emoji: "🔴", label: "Ao Vivo", action: () => handleNavigate("live") },
    { emoji: "⏳", label: "Aguardando", action: () => handleNavigate("pending") },
    { emoji: "📋", label: "Atletas", action: () => handleNavigate("atletas") },
    { emoji: "👤", label: "Dados Pessoais", action: () => handleNavigate("profile") },
    ...(isAdmin ? [{ emoji: "⚙️", label: "Admin", action: () => handleNavigate("admin") }] : []),
    { emoji: "📝", label: "Nova Partida", action: () => handleNavigate("newMatch") },
    { emoji: "🚪", label: "Sair", action: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <DashboardTopBar 
        menuOpen={menuOpen} 
        setMenuOpen={setMenuOpen} 
        user={user} 
        onNewMatch={() => {
          logger.info("[DashboardPage] new match click");
          router.push("/match/new");
        }} 
        onLogout={handleLogout} 
      />

      <DashboardSidebar 
        menuOpen={menuOpen} 
        setMenuOpen={setMenuOpen} 
        menuItems={menuItems} 
      />

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
    </div>
  );
}