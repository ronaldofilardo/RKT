"use client";

import { DashboardChrome } from "./components/DashboardChrome";
import { DashboardViewRouter } from "./components/DashboardViewRouter";
import { DashboardMatchModals } from "./components/DashboardMatchModals";
import { useDashboardPageModel } from "./use-dashboard-page-model";
import { useDashboardMatchActions } from "./use-dashboard-match-actions";
import { useDashboardSetSummary } from "./use-dashboard-set-summary";

export default function DashboardPage() {
  const model = useDashboardPageModel();
  const actions = useDashboardMatchActions(model);
  const summary = useDashboardSetSummary();

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <DashboardChrome user={model.user} navigateToTarget={model.navigateToTarget} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <DashboardViewRouter
          view={model.view}
          loading={model.loading}
          {...model.filters}
          suspendedFromApi={model.suspendedFromApi}
          navigateToTarget={model.navigateToTarget}
          openMatchDetails={actions.openMatchDetails}
          openMatchReport={actions.openMatchReport}
          finishMatch={actions.finishMatch}
          deleteMatch={actions.deleteMatch}
          openMatchEditScore={actions.openMatchEditScore}
          resumeMatch={actions.resumeMatch}
          openMatchSetSummary={summary.openMatchSetSummary}
          openMatchEditInfo={actions.openMatchEditInfo}
        />
      </main>

      <DashboardMatchModals
        matchToDelete={model.matchToDelete}
        onCancelDelete={() => model.setMatchToDelete(null)}
        onConfirmDelete={() => {
          model.confirmDeleteMatch("hard");
          model.setMatchToDelete(null);
        }}
        matchToFinish={model.matchToFinish}
        onCancelFinish={() => model.setMatchToFinish(null)}
        onConfirmFinish={model.confirmFinishMatch}
        serverMatch={actions.selectedMatchForServer}
        startingMatch={actions.startingMatch}
        onSelectServer={actions.selectServingPlayer}
        onCloseServer={() => actions.setSelectedMatchForServer(null)}
        setSummaryMatch={summary.setSummaryMatch}
        setSummaryTimelinePoints={summary.setSummaryTimelinePoints}
        completedSetsCount={summary.completedSetsCount}
        completedSetsData={summary.completedSetsData}
        onCloseSetSummary={() => summary.setSetSummaryMatch(null)}
        onResumeSetSummary={() => {
          if (!summary.setSummaryMatch) return;
          const m = summary.setSummaryMatch;
          summary.setSetSummaryMatch(null);
          actions.resumeMatch(m);
        }}
        editMatch={actions.matchToEditInfo}
        onCloseEditInfo={() => actions.setMatchToEditInfo(null)}
        onSuccessEditInfo={() => {
          model.fetchDashboardData();
          actions.setMatchToEditInfo(null);
        }}
      />
    </div>
  );
}
