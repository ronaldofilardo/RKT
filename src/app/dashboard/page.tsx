"use client";

import { useState, useCallback, useEffect } from "react";
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
      handleResumeSuspended(match);
    } else {
      router.push(`/match/${match.id}/scoring?modal=edit-score`);
    }
  }, [router, handleResumeSuspended]);

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
    <div className="min-h-screen bg-gray-100">
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
        />
      </main>

      {matchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMatchToDelete(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-lg p-6 max-w-sm">
            <h3 className="font-bold mb-2">Excluir partida?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMatchToDelete(null)}
                className="flex-1 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDeleteMatch("hard");
                  setMatchToDelete(null);
                }}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}