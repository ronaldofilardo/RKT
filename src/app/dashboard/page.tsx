"use client";

import { useEffect, useState } from 'react';
import { DashboardChrome } from "./components/DashboardChrome";
import { DashboardViewRouter } from "./components/DashboardViewRouter";
import { DashboardMatchModals } from "./components/DashboardMatchModals";
import { ShareSpectateModal } from "@/components/scoring/ShareSpectateModal";
import { VIEW_TITLES } from "./dashboard-view.logic";
import { useDashboardPageModel } from "./use-dashboard-page-model";
import { useDashboardMatchActions } from "./use-dashboard-match-actions";
import { useDashboardSetSummary } from "./use-dashboard-set-summary";
import { useDashboardShare } from "./hooks/use-dashboard-share";

export default function DashboardPage() {
  const model = useDashboardPageModel();
  const actions = useDashboardMatchActions(model);
  const summary = useDashboardSetSummary();
  const share = useDashboardShare();
  const [ctId, setCtId] = useState<string | null>(null);
  const [ctName, setCtName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [followedPlayerIds, setFollowedPlayerIds] = useState<string[]>([]);
  const [activeArea, setActiveArea] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me').then((res) => (res.ok ? res.json() : null)).then((data) => {
      if (!cancelled && data) {
        const activeId = data.activeContextId ?? null;
        setCtId(activeId);
        setUserId(data.user?.id ?? null);
        setUserName(data.user?.name ?? null);
        setFollowedPlayerIds(data.followedPlayerIds ?? []);
        setActiveArea(data.activeArea ?? null);
        if (activeId && activeId !== 'PARTICULAR') {
          const currentMem = data.memberships?.find((m: any) => m.ctId === activeId);
          const currentCtx = data.availableContexts?.find((c: any) => c.id === activeId);
          setCtName(currentMem?.ct?.name || currentCtx?.label?.split(' (')[0] || null);
        } else { setCtName(null); }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <DashboardChrome
        user={model.user}
        navigateToTarget={model.navigateToTarget}
        onContextSwitched={model.fetchDashboardData}
        title={VIEW_TITLES[model.view] ?? 'Início'}
        onBack={() => model.navigateToTarget('dashboard')}
        showBackButton={model.view !== 'dashboard'}
      />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <DashboardViewRouter
          view={model.view} loading={model.loading}
          ctId={ctId} ctName={ctName} userId={userId} userName={userName}
          followedPlayerIds={followedPlayerIds} activeArea={activeArea}
          {...model.filters}
          suspendedFromApi={model.suspendedFromApi}
          errorMessage={model.errorMessage}
          onRetry={model.fetchDashboardData}
          nextCursor={model.nextCursor}
          onLoadMore={model.loadMore}
          loadingMore={model.loadingMore}
          navigateToTarget={model.navigateToTarget}
          openMatchDetails={actions.openMatchDetails} openMatchReport={actions.openMatchReport}
          finishMatch={actions.finishMatch} deleteMatch={actions.deleteMatch}
          openMatchEditScore={actions.openMatchEditScore} resumeMatch={actions.resumeMatch}
          openMatchSetSummary={summary.openMatchSetSummary} openMatchEditInfo={actions.openMatchEditInfo}
          onShareMatch={share.openShareModal}
        />
      </main>

      <DashboardMatchModals
        matchToDelete={model.matchToDelete} onCancelDelete={() => model.setMatchToDelete(null)}
        onConfirmDelete={() => { model.confirmDeleteMatch("hard"); model.setMatchToDelete(null); }}
        matchToFinish={model.matchToFinish} onCancelFinish={() => model.setMatchToFinish(null)}
        onConfirmFinish={model.confirmFinishMatch} serverMatch={actions.selectedMatchForServer}
        startingMatch={actions.startingMatch} onSelectServer={actions.selectServingPlayer}
        onCloseServer={() => actions.setSelectedMatchForServer(null)} setSummaryMatch={summary.setSummaryMatch}
        setSummaryTimelinePoints={summary.setSummaryTimelinePoints} completedSetsCount={summary.completedSetsCount}
        completedSetsData={summary.completedSetsData} onCloseSetSummary={() => summary.setSetSummaryMatch(null)}
        onResumeSetSummary={() => {
          if (!summary.setSummaryMatch) return; const m = summary.setSummaryMatch;
          summary.setSetSummaryMatch(null); actions.resumeMatch(m);
        }}
        editMatch={actions.matchToEditInfo} onCloseEditInfo={() => actions.setMatchToEditInfo(null)}
        onSuccessEditInfo={() => { model.fetchDashboardData(); actions.setMatchToEditInfo(null); }}
      />

      {share.matchToShare && (
        <ShareSpectateModal matchId={share.matchToShare.id} isOpen={Boolean(share.matchToShare)} onClose={share.closeShareModal} />
      )}
    </div>
  );
}
