import { MatchCard, type DashboardMatchPayload } from "@/components/dashboard/MatchCard";
import { DashboardMatchListSection } from "./dashboard-match-list-section";
import type { DashboardViewRouterProps } from "./dashboard-view-router.types";

export function DashboardViewRouter(props: DashboardViewRouterProps) {
  const {
    view, loading, finishedMatches, liveMatches, pendingMatches, historyMatches,
    visibleMatches, suspendedFromApi, handleNavigate, handleMatchClick,
    handleMatchReport, handleMatchFinish, handleMatchDelete,
    handleMatchEditScore, handleMatchResume, handleMatchSetSummary, handleMatchEditInfo,
  } = props;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" role="status" aria-live="polite">
        <p className="text-telemetry-text-primary font-semibold">Carregando...</p>
      </div>
    );
  }

  const views: Record<string, () => JSX.Element> = {
    annotated: () => (
      <DashboardMatchListSection
        headingId="annotated-heading"
        title="Partidas Anotadas"
        emptyMessage="Nenhuma partida anotada encontrada."
        matches={finishedMatches}
        onBack={() => handleNavigate("dashboard")}
        renderCard={(m) => (
          <MatchCard key={m.id} match={m} onClick={handleMatchClick} onReport={handleMatchReport} />
        )}
      />
    ),
    live: () => (
      <DashboardMatchListSection
        headingId="live-heading"
        title="Partidas Ao Vivo"
        emptyMessage="Nenhuma partida ao vivo no momento."
        matches={liveMatches}
        onBack={() => handleNavigate("dashboard")}
        renderCard={(m) => (
          <MatchCard
            key={m.id}
            match={m}
            onClick={handleMatchClick}
            onReport={handleMatchReport}
            onFinish={handleMatchFinish}
            onEditScore={handleMatchEditScore}
            onResumeMatch={handleMatchResume}
            onSetSummary={handleMatchSetSummary}
            onEditInfo={handleMatchEditInfo}
          />
        )}
      />
    ),
    pending: () => (
      <DashboardMatchListSection
        headingId="pending-heading"
        title="Partidas Aguardando"
        emptyMessage="Nenhuma partida agendada aguardando no momento."
        matches={pendingMatches}
        onBack={() => handleNavigate("dashboard")}
        renderCard={(m) => (
          <MatchCard key={m.id} match={m} onClick={handleMatchClick} onDelete={handleMatchDelete} onEditInfo={handleMatchEditInfo} />
        )}
      />
    ),
    history: () => (
      <DashboardMatchListSection
        headingId="history-heading"
        title="Histórico de Partidas"
        emptyMessage="Nenhuma partida no histórico."
        matches={historyMatches}
        onBack={() => handleNavigate("dashboard")}
        renderCard={(m) => (
          <MatchCard key={m.id} match={m} onClick={handleMatchClick} onReport={handleMatchReport} onDelete={handleMatchDelete} />
        )}
      />
    ),
    dashboard: () => (
      <section aria-labelledby="dashboard-heading">
        <h2 id="dashboard-heading" className="sr-only">
          Dashboard
        </h2>
        {suspendedFromApi.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-telemetry-text-muted uppercase mb-3">
              Anotações Suspensas
            </h3>
            <div className="space-y-3">
              {suspendedFromApi.map((m: DashboardMatchPayload) => (
                <MatchCard
                  key={m.id ?? m.suspendedSessionId}
                  match={m}
                  onClick={handleMatchClick}
                  onReport={handleMatchReport}
                  onEditScore={handleMatchEditScore}
                  onResumeMatch={handleMatchResume}
                  onSetSummary={handleMatchSetSummary}
                  onEditInfo={handleMatchEditInfo}
                />
              ))}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {visibleMatches.length === 0 ? (
            <p className="text-telemetry-text-muted text-center py-8">
              Nenhuma partida encontrada.
            </p>
          ) : (
            visibleMatches.map((m: DashboardMatchPayload) => (
              <MatchCard
                key={m.id}
                match={m}
                onClick={handleMatchClick}
                onReport={handleMatchReport}
                onFinish={handleMatchFinish}
                onDelete={handleMatchDelete}
                onEditScore={handleMatchEditScore}
                onResumeMatch={handleMatchResume}
                onSetSummary={handleMatchSetSummary}
                onEditInfo={handleMatchEditInfo}
              />
            ))
          )}
        </div>
      </section>
    ),
  };

  return views[view]() || views.dashboard();
}
