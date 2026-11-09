import { MatchCard } from "@/components/dashboard/MatchCard";
import { DashboardMatchListSection } from "./dashboard-match-list-section";
import { DashboardHomeSection } from "./dashboard-home-section";
import type { DashboardViewRouterProps } from "./dashboard-view-router.types";

export function DashboardViewRouter(props: DashboardViewRouterProps) {
  const {
    view, loading, ctId, ctName, userId, userName, followedPlayerIds, activeArea,
    finishedMatches, liveMatches, pendingMatches,
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

  const shared = { ctId, ctName, userId, followedPlayerIds, onShare: onShareMatch };
  const allCardActions = {
    ...shared,
    onClick: openMatchDetails,
    onReport: openMatchReport,
    onFinish: finishMatch,
    onDelete: deleteMatch,
    onEditScore: openMatchEditScore,
    onResumeMatch: resumeMatch,
    onSetSummary: openMatchSetSummary,
    onEditInfo: openMatchEditInfo,
  };

  const allMatches = suspendedFromApi.length > 0 ? [...suspendedFromApi, ...visibleMatches] : visibleMatches;

  const views: Record<string, () => JSX.Element> = {
    annotated: () => (
      <DashboardMatchListSection
        headingId="annotated-heading" title="Partidas Anotadas"
        emptyMessage="Nenhuma partida anotada encontrada." matches={finishedMatches}
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => <MatchCard key={m.id} match={m} {...shared} onClick={openMatchDetails} onReport={openMatchReport} />}
      />
    ),
    live: () => (
      <DashboardMatchListSection
        headingId="live-heading" title="Partidas Ao Vivo"
        emptyMessage="Nenhuma partida ao vivo no momento." matches={liveMatches}
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => <MatchCard key={m.id} match={m} {...allCardActions} />}
      />
    ),
    pending: () => (
      <DashboardMatchListSection
        headingId="pending-heading" title="Partidas Aguardando"
        emptyMessage="Nenhuma partida agendada aguardando no momento." matches={pendingMatches}
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => <MatchCard key={m.id} match={m} {...shared} onClick={openMatchDetails} onDelete={deleteMatch} onEditInfo={openMatchEditInfo} />}
      />
    ),
    history: () => (
      <DashboardMatchListSection
        headingId="history-heading" title="Minhas Partidas"
        emptyMessage="Nenhuma partida encontrada." matches={allMatches}
        activeArea={activeArea} showEmptyState={true}
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => <MatchCard key={m.id ?? m.suspendedSessionId} match={m} {...allCardActions} />}
      />
    ),
    reports: () => (
      <DashboardMatchListSection
        headingId="reports-heading" title="Relatórios"
        emptyMessage="Nenhuma partida finalizada com relatório encontrada." matches={finishedMatches}
        onBack={() => navigateToTarget("dashboard")}
        renderCard={(m) => (
          <MatchCard
            key={m.id} match={m} {...shared}
            onClick={(match) => openMatchReport(match, 'timeline')}
            onReport={(match) => openMatchReport(match, 'timeline')}
          />
        )}
      />
    ),
    dashboard: () => (
      <DashboardHomeSection userName={userName} activeArea={activeArea} navigateToTarget={navigateToTarget} />
    ),
  };

  return views[view]?.() ?? views.dashboard();
}
