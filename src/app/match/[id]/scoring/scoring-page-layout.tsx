'use client';

import type { useRouter } from 'next/navigation';
import { MatchHeader } from '@/components/scoring/MatchHeader';
import { ScoringModals } from './ScoringModals';
import { ScoringPageControls } from './scoring-page-controls';
import { useServeInlineControls } from './use-serve-inline-controls';
import { ScoringPagePlayArea } from './scoring-page-play-area';
import { SyncStatusBanner, TimelineLoadingOverlay } from './scoring-page-screens';
import {
  useScoringPageChrome,
  type ScoringPageDerived,
  type ScoringPageEffects,
  type ScoringPageState,
} from './use-scoring-page-chrome';
import { homeForProfileString } from '@/core/access/home';

type AppRouter = ReturnType<typeof useRouter>;

interface ScoringPageLayoutProps {
  state: ScoringPageState;
  handlers: ScoringPageEffects;
  derived: ScoringPageDerived;
  chrome: ReturnType<typeof useScoringPageChrome>;
  /** `state.match` já estreitado para não-nulo pela página. */
  match: NonNullable<ScoringPageState['match']>;
  matchId: string;
  cameFromDashboard: boolean;
  router: AppRouter;
}

export function ScoringPageLayout({
  state,
  handlers,
  derived,
  chrome,
  match,
  matchId,
  cameFromDashboard,
  router,
}: ScoringPageLayoutProps) {
  const { fontScale } = state;
  const { abandonCurrentSession } = handlers;
  const { isFinished } = derived;

  const serve = useServeInlineControls(state, handlers, derived);
  const navigateReport = () => router.push(`/match/${matchId}/report`);
  const navigateDashboard = () => router.push(homeForProfileString(sessionStorage.getItem('user_role')) as any);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-telemetry-base flex flex-col"
      style={{ fontSize: `${fontScale * 100}%` }}
    >
      <SyncStatusBanner syncStatus={state.syncStatus} />

      <MatchHeader
        onClose={async () => {
          await abandonCurrentSession();
          navigateDashboard();
        }}
        onTimeline={chrome.openTimelineView}
        isFinished={isFinished}
      />

      {chrome.isTimelineLoading && <TimelineLoadingOverlay />}

      <ScoringPagePlayArea
        state={state}
        handlers={handlers}
        derived={derived}
        chrome={chrome}
        match={match}
        matchId={matchId}
        serveControls={serve.controls}
        onNavigateReport={navigateReport}
        onNavigateDashboard={navigateDashboard}
      />

      <ScoringPageControls state={state} handlers={handlers} derived={derived} matchId={matchId} serveOptions={serve.options} />

      <ScoringModals
        state={state}
        handlers={handlers}
        derived={derived}
        match={match}
        matchId={matchId}
        cameFromDashboard={cameFromDashboard}
        setSummaryModalState={chrome.setSummaryModalState}
        onCloseSetSummary={() =>
          chrome.setSetSummaryModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onNavigateDashboard={navigateDashboard}
        onNavigateReport={navigateReport}
      />
    </div>
  );
}
