"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { useToast } from "@/components/Toast";
import { useSession } from "@/contexts/SessionContext";
import { logger } from "@/lib/logger";
import { ensureAuthCookie, clearAuthState, clearRedirectingFlag } from "@/lib/auth-client";
import {
  useDashboardNavigation,
  useDashboardData,
  useModalState,
  useUserAuth,
} from "./dashboard.hooks";
import { useResumeSession } from "./dashboard.resume";
import { useDeleteMatch, useFinishMatch } from "./dashboard.actions";

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
  const { matches, suspendedFromApi, loading, fetchDashboardData } =
    useDashboardData(router);
  const { matchToDelete, setMatchToDelete, matchToFinish, setMatchToFinish } =
    useModalState();

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

  logger.info(
    "[DashboardPage] computed view=",
    view,
    "loading=",
    loading,
    "matches=",
    matches.length,
    "suspended=",
    suspendedFromApi.length
  );

  const finishedMatches = useMemo(
    () => matches.filter((m: any) => m.state === "FINISHED"),
    [matches],
  );

  const handleMatchClick = useCallback(
    (match: any) => {
      logger.info("[DashboardPage] match click", match.id, match.state);
      if (match.state === "FINISHED") {
        router.push(`/match/${match.id}/report`);
      } else if (match.suspendedSessionId || match.matchStateSnapshot) {
        handleResumeSuspended(match);
      } else {
        router.push(`/match/${match.id}/scoring`);
      }
    },
    [router, handleResumeSuspended],
  );

  const handleMatchReport = useCallback(
    (match: any) => {
      router.push(`/match/${match.id}/report`);
    },
    [router],
  );

  const handleMatchFinish = useCallback(
    (match: any) => {
      setMatchToFinish(match);
    },
    [setMatchToFinish],
  );

  const handleMatchDelete = useCallback(
    (match: any) => {
      setMatchToDelete(match);
    },
    [setMatchToDelete],
  );

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

  const renderView = () => {
    logger.info("[DashboardPage] renderView loading=", loading, "view=", view);
    if (loading) {
      return (
        <div
          className="flex items-center justify-center py-12"
          role="status"
          aria-live="polite"
        >
          <p className="text-gray-500">Carregando...</p>
        </div>
      );
    }

    if (view === "annotated") {
      return (
        <section aria-labelledby="annotated-heading">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="annotated-heading"
              className="text-xl font-bold text-gray-900"
            >
              Partidas Anotadas
            </h2>
            <button
              type="button"
              onClick={() => handleNavigate("dashboard")}
              className="text-sm text-blue-600 hover:underline"
            >
              Voltar para Início
            </button>
          </div>
          {finishedMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma partida anotada encontrada.
            </p>
          ) : (
            <div className="space-y-3">
              {finishedMatches.map((m: any) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onClick={handleMatchClick}
                  onReport={handleMatchReport}
                />
              ))}
            </div>
          )}
        </section>
      );
    }

    return (
      <section aria-labelledby="dashboard-heading">
        <h2 id="dashboard-heading" className="sr-only">
          Dashboard
        </h2>
        {suspendedFromApi.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Anotações Suspensas
            </h3>
            <div className="space-y-3">
              {suspendedFromApi.map((m: any) => (
                <MatchCard
                  key={m.id ?? m.suspendedSessionId}
                  match={m}
                  onClick={handleMatchClick}
                  onReport={handleMatchReport}
                />
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {matches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma partida encontrada.
            </p>
          ) : (
            matches.map((m: any) => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={handleMatchClick}
                onReport={handleMatchReport}
                onFinish={handleMatchFinish}
                onDelete={handleMatchDelete}
              />
            ))
          )}
        </div>
      </section>
    );
  };

  const isAdmin = user?.role === "ADMIN";

  const menuItems = [
    { emoji: "🏠", label: "Início", action: () => handleNavigate("dashboard") },
    {
      emoji: "📜",
      label: "Histórico",
      action: () => handleNavigate("history"),
    },
    {
      emoji: "📝",
      label: "Partidas Anotadas",
      action: () => handleNavigate("annotated"),
    },
    { emoji: "🔴", label: "Ao Vivo", action: () => handleNavigate("live") },
    {
      emoji: "⏳",
      label: "Aguardando",
      action: () => handleNavigate("pending"),
    },
    { emoji: "📋", label: "Atletas", action: () => handleNavigate("atletas") },
    {
      emoji: "👤",
      label: "Dados Pessoais",
      action: () => handleNavigate("profile"),
    },
    ...(isAdmin
      ? [{ emoji: "⚙️", label: "Admin", action: () => handleNavigate("admin") }]
      : []),
    {
      emoji: "📝",
      label: "Nova Partida",
      action: () => handleNavigate("newMatch"),
    },
    { emoji: "🚪", label: "Sair", action: handleLogout },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="hamburger-menu-button"
              onClick={() => {
                const next = !menuOpen;
                logger.info("[DashboardPage] hamburger click menuOpen=", next);
                setMenuOpen(next);
              }}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">Início</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  logger.info("[DashboardPage] new match click");
                  router.push("/match/new");
                }}
                className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                aria-label="Nova partida"
              >
                + Nova Partida
              </button>
              <span className="text-sm text-gray-500">{user.name}</span>
              {user.role === "ADMIN" && (
                <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                  Admin
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
                aria-label="Sair"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            className="relative z-[70] bg-white w-72 max-w-full h-full shadow-xl flex flex-col p-4 select-none"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-500 uppercase">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
                className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ul className="flex-1 space-y-1">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => {
                      logger.info("[DashboardPage] menu item click", item.label);
                      setMenuOpen(false);
                      item.action();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    <span className="text-lg" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">{renderView()}</main>

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