import { MatchCard } from "@/components/dashboard/MatchCard";
import { DashboardMatchListSection } from "./dashboard-match-list-section";
import { DashboardHomeSection } from "./dashboard-home-section";
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
      <DashboardHomeSection
        visibleMatches={visibleMatches}
        suspendedFromApi={suspendedFromApi}
        handleMatchClick={handleMatchClick}
        handleMatchReport={handleMatchReport}
        handleMatchFinish={handleMatchFinish}
        handleMatchDelete={handleMatchDelete}
        handleMatchEditScore={handleMatchEditScore}
        handleMatchResume={handleMatchResume}
        handleMatchSetSummary={handleMatchSetSummary}
        handleMatchEditInfo={handleMatchEditInfo}
      />
    ),
  };

  return views[view]() || views.dashboard();
}
