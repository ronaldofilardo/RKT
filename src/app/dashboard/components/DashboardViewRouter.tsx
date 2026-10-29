import { MatchCard } from "@/components/dashboard/MatchCard";
import { DashboardMatchListSection } from "./dashboard-match-list-section";
import { DashboardHomeSection } from "./dashboard-home-section";
import type { DashboardViewRouterProps } from "./dashboard-view-router.types";

export function DashboardViewRouter(props: DashboardViewRouterProps) {
  const {
    view, loading, finishedMatches, liveMatches, pendingMatches, historyMatches,
    visibleMatches, suspendedFromApi, navigateToTarget, openMatchDetails,
    openMatchReport, finishMatch, deleteMatch, openMatchEditScore,
    resumeMatch, openMatchSetSummary, openMatchEditInfo, onShareMatch,
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
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => (
          <MatchCard key={m.id} match={m} onClick={openMatchDetails} onReport={openMatchReport} onShare={onShareMatch} />
        )}
      />
    ),
    live: () => (
      <DashboardMatchListSection
        headingId="live-heading"
        title="Partidas Ao Vivo"
        emptyMessage="Nenhuma partida ao vivo no momento."
        matches={liveMatches}
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => (
          <MatchCard
            key={m.id} match={m} onClick={openMatchDetails} onReport={openMatchReport}
            onFinish={finishMatch} onEditScore={openMatchEditScore} onResumeMatch={resumeMatch}
            onSetSummary={openMatchSetSummary} onEditInfo={openMatchEditInfo} onShare={onShareMatch}
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
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => (
          <MatchCard key={m.id} match={m} onClick={openMatchDetails} onDelete={deleteMatch} onEditInfo={openMatchEditInfo} onShare={onShareMatch} />
        )}
      />
    ),
    history: () => (
      <DashboardMatchListSection
        headingId="history-heading"
        title="Histórico de Partidas"
        emptyMessage="Nenhuma partida no histórico."
        matches={historyMatches}
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => (
          <MatchCard key={m.id} match={m} onClick={openMatchDetails} onReport={openMatchReport} onDelete={deleteMatch} onShare={onShareMatch} />
        )}
      />
    ),
    dashboard: () => (
      <DashboardHomeSection
        visibleMatches={visibleMatches} suspendedFromApi={suspendedFromApi}
        openMatchDetails={openMatchDetails} openMatchReport={openMatchReport}
        finishMatch={finishMatch} deleteMatch={deleteMatch}
        openMatchEditScore={openMatchEditScore} resumeMatch={resumeMatch}
        openMatchSetSummary={openMatchSetSummary} openMatchEditInfo={openMatchEditInfo}
        onShareMatch={onShareMatch}
      />
    ),
  };

  return views[view]() || views.dashboard();
}
