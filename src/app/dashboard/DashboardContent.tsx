import { MatchCard } from '@/components/dashboard/MatchCard';
import { logger } from '@/lib/logger';
import type { Match } from './dashboard.types';
type DashboardMatch = Match & { suspendedSessionId?: string; matchStateSnapshot?: string | null };
type Props = { loading: boolean; view: "dashboard" | "annotated" | "live" | "pending" | "history"; finishedMatches: DashboardMatch[]; matches: DashboardMatch[]; suspendedFromApi: DashboardMatch[]; handleNavigate: (view: Props['view']) => void; handleMatchClick: (match: DashboardMatch) => void; handleMatchReport: (match: DashboardMatch) => void; handleMatchFinish: (match: DashboardMatch) => void; handleMatchDelete: (match: DashboardMatch) => void };
export function DashboardContent({ loading, view, finishedMatches, matches, suspendedFromApi, handleNavigate, handleMatchClick, handleMatchReport, handleMatchFinish, handleMatchDelete }: Props) { 
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
              {finishedMatches.map((m: DashboardMatch) => (
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
              {suspendedFromApi.map((m: DashboardMatch) => (
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
            matches.map((m: DashboardMatch) => (
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
}
