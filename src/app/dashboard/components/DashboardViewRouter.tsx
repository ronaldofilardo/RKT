import { MatchCard } from "@/components/dashboard/MatchCard";

interface DashboardViewRouterProps {
  view: "dashboard" | "annotated" | "live" | "pending" | "history";
  loading: boolean;
  finishedMatches: any[];
  liveMatches: any[];
  pendingMatches: any[];
  historyMatches: any[];
  visibleMatches: any[];
  suspendedFromApi: any[];
  handleNavigate: (v: any) => void;
  handleMatchClick: (m: any) => void;
  handleMatchReport: (m: any) => void;
  handleMatchFinish: (m: any) => void;
  handleMatchDelete: (m: any) => void;
}

export function DashboardViewRouter(props: DashboardViewRouterProps) {
  const {
    view,
    loading,
    finishedMatches,
    liveMatches,
    pendingMatches,
    historyMatches,
    visibleMatches,
    suspendedFromApi,
    handleNavigate,
    handleMatchClick,
    handleMatchReport,
    handleMatchFinish,
    handleMatchDelete,
  } = props;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
        <p className="text-gray-700 dark:text-gray-200 font-semibold">Carregando...</p>
      </div>
    );
  }

  const views: Record<string, () => JSX.Element> = {
    annotated: () => (
      <section aria-labelledby="annotated-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="annotated-heading" className="text-xl font-bold text-gray-900">
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
    ),
    live: () => (
      <section aria-labelledby="live-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="live-heading" className="text-xl font-bold text-gray-900">
            Partidas Ao Vivo
          </h2>
          <button
            type="button"
            onClick={() => handleNavigate("dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            Voltar para Início
          </button>
        </div>
        {liveMatches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma partida ao vivo no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {liveMatches.map((m: any) => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={handleMatchClick}
                onReport={handleMatchReport}
                onFinish={handleMatchFinish}
              />
            ))}
          </div>
        )}
      </section>
    ),
    pending: () => (
      <section aria-labelledby="pending-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="pending-heading" className="text-xl font-bold text-gray-900">
            Partidas Aguardando
          </h2>
          <button
            type="button"
            onClick={() => handleNavigate("dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            Voltar para Início
          </button>
        </div>
        {pendingMatches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma partida agendada aguardando no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingMatches.map((m: any) => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={handleMatchClick}
                onDelete={handleMatchDelete}
              />
            ))}
          </div>
        )}
      </section>
    ),
    history: () => (
      <section aria-labelledby="history-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="history-heading" className="text-xl font-bold text-gray-900">
            Histórico de Partidas
          </h2>
          <button
            type="button"
            onClick={() => handleNavigate("dashboard")}
            className="text-sm text-blue-600 hover:underline"
          >
            Voltar para Início
          </button>
        </div>
        {historyMatches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma partida no histórico.
          </p>
        ) : (
          <div className="space-y-3">
            {historyMatches.map((m: any) => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={handleMatchClick}
                onReport={handleMatchReport}
                onDelete={handleMatchDelete}
              />
            ))}
          </div>
        )}
      </section>
    ),
    dashboard: () => (
      <section aria-labelledby="dashboard-heading">
        <h2 id="dashboard-heading" className="sr-only">
          Dashboard
        </h2>
        {suspendedFromApi.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase mb-3">
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
          {visibleMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma partida encontrada.
            </p>
          ) : (
            visibleMatches.map((m: any) => (
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
    ),
  };

  return views[view]() || views.dashboard();
}
