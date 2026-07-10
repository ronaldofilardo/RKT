"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MatchCard } from "@/components/dashboard/MatchCard";
import { NewAthleteModal } from "@/app/match/new/components/NewAthleteModal";
import { useToast } from "@/components/Toast";
import {
  getMatchFormatRules,
  validateSetScore,
  isMatchTiebreakActive,
} from "@/lib/matchConfig";
import type { TennisFormat } from "@/lib/matchConfig";
import { useSession } from "@/contexts/SessionContext";

type DashboardView =
  | "dashboard"
  | "history"
  | "annotated"
  | "live"
  | "pending"
  | "profile";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Match {
  id: string;
  player1: { name: string };
  player2: { name: string };
  state: "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
  format: string;
  scheduledAt?: string;
}

interface Athlete {
  id: string;
  name: string;
  gender?: string;
  age?: number;
  dominance?: string;
  backhand?: string;
  ranking?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [suspendedFromApi, setSuspendedFromApi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const { setSession, setPendingEdit, writeToSessionStorage } = useSession();
  const { toast } = useToast();

  const activeView: DashboardView = (() => {
    switch (pathname) {
      case "/historico":
        return "history";
      case "/partidasanotadas":
        return "annotated";
      case "/partidasaovivo":
        return "live";
      case "/aguardandoanotador":
        return "pending";
      case "/dados-pessoais":
        return "profile";
      default:
        return "dashboard";
    }
  })();

  const fetchDashboardData = useCallback(() => {
    const accessToken = sessionStorage.getItem("access_token");
    Promise.all([
      fetch("/api/matches", {
        headers: { authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : { matches: [] })),
      fetch("/api/matches/suspended-sessions", {
        headers: { authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : { matches: [] })),
    ])
      .then(([matchData, suspendedData]) => {
        setMatches(matchData.matches || []);
        setSuspendedFromApi(suspendedData.matches || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const userId = sessionStorage.getItem("user_id");
    const userRole = sessionStorage.getItem("user_role");

    if (!userId || !userRole) {
      router.push("/login");
      return;
    }

    setUser({
      id: userId,
      name: "Usuário",
      email: "",
      role: userRole,
    });

    fetchDashboardData();
  }, [router, fetchDashboardData]);

  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastAbandon = sessionStorage.getItem("last_abandon_timestamp");
        if (lastAbandon) {
          const lastTime = parseInt(lastAbandon, 10);
          const now = Date.now();
          if (now - lastTime < 60000) {
            fetchDashboardData();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  const handleLogout = () => {
    if (!confirm("Tem certeza que deseja sair?")) return;
    sessionStorage.clear();
    router.push("/login");
  };

  const handleResumeSuspended = useCallback((match: any) => {
    const isRealSuspendedSession = Boolean(match.matchStateSnapshot && match.suspendedSessionId);

    const rawScoreState = match.scoreState;
    let scoreState: any = null;
    if (rawScoreState) {
      if (rawScoreState.sets && rawScoreState.currentGame) {
        scoreState = rawScoreState;
      } else if (rawScoreState.state && Array.isArray(rawScoreState.history)) {
        scoreState = rawScoreState.state;
      }
    }

    const floorSets = scoreState?.sets?.length
      ? { player1: scoreState.sets[scoreState.sets.length - 1].player1, player2: scoreState.sets[scoreState.sets.length - 1].player2 }
      : null;

    setSession({
      matchId: match.id,
      sessionId: match.suspendedSessionId ?? null,
      bankScoreState: scoreState,
      matchStateSnapshot: match.matchStateSnapshot,
      snapshotStatus: match.snapshotStatus ?? 'IN_SYNC',
      snapshotPointCount: match.snapshotPointCount ?? 0,
      bankPointCount: match.bankPointCount ?? 0,
      suspendedSessionId: match.suspendedSessionId ?? null,
    });

    if (scoreState) {
      setPendingEdit(scoreState, floorSets);
    }

    const sessionStorageData: Record<string, any> = {
      bankScoreState: scoreState,
      matchStateSnapshot: match.matchStateSnapshot,
      snapshotStatus: match.snapshotStatus ?? 'IN_SYNC',
      snapshotPointCount: match.snapshotPointCount ?? 0,
      bankPointCount: match.bankPointCount ?? 0,
      suspendedSessionId: match.suspendedSessionId ?? null,
    };

    if (!isRealSuspendedSession) {
      const stored = sessionStorage.getItem(`suspended_session_${match.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.matchStateSnapshot) {
            sessionStorageData.matchStateSnapshot = parsed.matchStateSnapshot;
            sessionStorageData.snapshotStatus = parsed.snapshotStatus ?? 'IN_SYNC';
            sessionStorageData.snapshotPointCount = parsed.snapshotPointCount ?? 0;
            sessionStorageData.bankPointCount = parsed.bankPointCount ?? 0;
          }
        } catch {}
      }
    }

    sessionStorage.setItem(
      `suspended_session_${match.id}`,
      JSON.stringify(sessionStorageData),
    );
    router.push(`/match/${match.id}/scoring`);
  }, [router, setSession, setPendingEdit]);

  const handleViewReport = useCallback(
    (match: any) => {
      router.push(`/match/${match.id}/report`);
    },
    [router],
  );

  const handleNavigate = useCallback(
    (view: DashboardView) => {
      setIsMenuOpen(false);
      switch (view) {
        case "history":
          router.push("/historico");
          break;
        case "annotated":
          router.push("/partidasanotadas");
          break;
        case "live":
          router.push("/partidasaovivo");
          break;
        case "pending":
          router.push("/aguardandoanotador");
          break;
        case "profile":
          router.push("/dados-pessoais");
          break;
        default:
          router.push("/dashboard");
      }
    },
    [router],
  );

  const handleAthleteCreated = (athlete: Athlete) => {
    toast({ type: 'success', message: 'Atleta cadastrado com sucesso!' });
    setShowNewAthleteModal(false);
  };

  const openMatches = matches.filter((m) => m.state === "SCHEDULED");
  const suspendedMatchIds = new Set(suspendedFromApi.map((s: any) => s.id));
  
  const completedMatches = matches.filter(
    (m) => m.state === "FINISHED" && !suspendedMatchIds.has(m.id)
  );

  const suspendedMatches = [
    ...suspendedFromApi.filter((s: any) => s.state !== "FINISHED"),
    ...matches.filter(
      (m) => m.state === "IN_PROGRESS" && !suspendedMatchIds.has(m.id)
    ),
  ];

  const liveCount = matches.filter((m) => m.state === "IN_PROGRESS").length;
  const pendingCount = openMatches.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex-shrink-0 border border-gray-200"
                aria-label="Menu"
                data-testid="hamburger-menu-button"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {activeView === "dashboard" && "Minhas Partidas"}
                {activeView === "history" && "Histórico"}
                {activeView === "annotated" && "Partidas Anotadas"}
                {activeView === "live" && "Partidas ao Vivo"}
                {activeView === "pending" && "Aguardando Anotador"}
                {activeView === "profile" && "Dados Pessoais"}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => router.push("/match/new")}
                className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                aria-label="Nova partida"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ Nova Partida</span>
              </button>
              {user?.role === "ADMIN" && (
                <button
                  onClick={() => router.push("/admin")}
                  className="rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-xs font-semibold text-red-500"
                >
                  Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <>
          <div
            data-testid="menu-overlay"
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
            style={{ transform: isMenuOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                aria-label="Fechar menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-3 space-y-2">
              <button
                onClick={() => handleNavigate("dashboard")}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${activeView === "dashboard" ? "bg-sky-50 text-sky-600 font-semibold" : "text-gray-700"}`}
              >
                <span className="text-xl mr-3">🏠</span>Início
              </button>
              <button
                onClick={() => handleNavigate("history")}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${activeView === "history" ? "bg-sky-50 text-sky-600 font-semibold" : "text-gray-700"}`}
              >
                <span className="text-xl mr-3">📜</span>Histórico
              </button>
              <button
                onClick={() => handleNavigate("annotated")}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${activeView === "annotated" ? "bg-sky-50 text-sky-600 font-semibold" : "text-gray-700"}`}
              >
                <span className="text-xl mr-3">📝</span>Partidas Anotadas
              </button>
              <button
                onClick={() => handleNavigate("live")}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${activeView === "live" ? "bg-sky-50 text-sky-600 font-semibold" : "text-gray-700"}`}
              >
                <span className="text-xl mr-3">🔴</span>Ao Vivo {liveCount > 0 && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">{liveCount}</span>}
              </button>
              <button
                onClick={() => { setIsMenuOpen(false); setShowNewAthleteModal(true); }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              >
                <span className="text-xl mr-3">🎾</span>Cadastrar Atleta
              </button>
              <button
                onClick={() => handleNavigate("pending")}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${activeView === "pending" ? "bg-sky-50 text-sky-600 font-semibold" : "text-gray-700"}`}
              >
                <span className="text-xl mr-3">⏳</span>Aguardando {pendingCount > 0 && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">{pendingCount}</span>}
              </button>
              <button
                onClick={() => handleNavigate("profile")}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${activeView === "profile" ? "bg-sky-50 text-sky-600 font-semibold" : "text-gray-700"}`}
              >
                <span className="text-xl mr-3">👤</span>Dados Pessoais
              </button>
              {user?.role === "ADMIN" && (
                <button
                  onClick={() => { setIsMenuOpen(false); router.push("/admin"); }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-red-600 font-semibold"
                >
                  <span className="text-xl mr-3">⚙️</span>Admin
                </button>
              )}
              <div className="pt-2 border-t mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 font-medium"
                >
                  <span className="text-xl mr-3">🚪</span>Sair
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {suspendedMatches.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-lg font-semibold text-gray-900">
                🔴 Anotações Suspensas
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Clique para retomar suas anotações
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suspendedMatches.map((rawMatch: any) => (
                <MatchCard
                  key={`${rawMatch.id}-suspended`}
                  match={rawMatch}
                  onClick={handleResumeSuspended}
                  onReport={handleViewReport}
                />
              ))}
            </div>
          </section>
        )}

        {activeView === "dashboard" && (
          <>
            {openMatches.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Próximas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {openMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onReport={handleViewReport}
                    />
                  ))}
                </div>
              </section>
            )}

            {completedMatches.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Finalizadas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onReport={handleViewReport}
                    />
                  ))}
                </div>
              </section>
            )}

            {openMatches.length === 0 &&
              completedMatches.length === 0 &&
              suspendedMatches.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhuma partida encontrada</p>
                  <button
                    onClick={() => router.push("/match/new")}
                    className="mt-4 bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700"
                  >
                    + Nova Partida
                  </button>
                </div>
              )}
          </>
        )}

        {activeView !== "dashboard" && (
          <div className="text-center py-12">
            <p className="text-gray-500">Em desenvolvimento...</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 text-sky-600 hover:text-sky-700"
            >
              ← Voltar para Início
            </button>
          </div>
        )}
      </main>

      {/* FAB - Nova Partida */}
      <button
        onClick={() => router.push("/match/new")}
        className="fixed bottom-20 right-4 z-10 w-14 h-14 bg-sky-600 hover:bg-sky-700 text-white rounded-full shadow-lg flex items-center justify-center text-2xl font-bold transition-all active:scale-95"
        aria-label="Nova Partida"
      >
        +
      </button>

      {/* Bottom Tab Bar (Mobile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-bottom"
        role="tablist"
      >
        <div className="grid grid-cols-4">
          <button
            onClick={() => handleNavigate("dashboard")}
            className={`flex flex-col items-center py-3 ${activeView === "dashboard" ? "text-sky-600" : "text-gray-500"}`}
            role="tab"
            aria-selected={activeView === "dashboard"}
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs mt-1">Início</span>
          </button>
          <button
            onClick={() => handleNavigate("history")}
            className={`flex flex-col items-center py-3 ${activeView === "history" ? "text-sky-600" : "text-gray-500"}`}
            role="tab"
            aria-selected={activeView === "history"}
          >
            <span className="text-xl">📊</span>
            <span className="text-xs mt-1">Stats</span>
          </button>
          <button
            className="flex flex-col items-center py-3 text-gray-500"
            role="tab"
            aria-disabled="true"
          >
            <span className="text-xl">📈</span>
            <span className="text-xs mt-1">Ranking</span>
          </button>
          <button
            onClick={() => handleNavigate("profile")}
            className={`flex flex-col items-center py-3 ${activeView === "profile" ? "text-sky-600" : "text-gray-500"}`}
            role="tab"
            aria-selected={activeView === "profile"}
          >
            <span className="text-xl">👤</span>
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </div>
      </nav>

      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={handleAthleteCreated}
      />
    </div>
  );
}
