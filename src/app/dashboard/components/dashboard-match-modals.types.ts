import type { ComponentProps } from 'react';
import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { TimelinePoint } from '@/core/scoring/types';
import type { DoublesSetup } from '@/schemas/contracts';
import type { DeletableMatch, FinishableMatch } from '../dashboard.types';

export type CompletedSetsData = ComponentProps<typeof SetSummaryModal>['completedSetsData'];

export interface DashboardMatchModalsProps {
  matchToDelete: DeletableMatch | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  matchToFinish?: FinishableMatch | null;
  onCancelFinish?: () => void;
  onConfirmFinish?: (text?: string, audio?: { blob: Blob; durationMs: number }) => Promise<void> | void;
  serverMatch: DashboardMatchPayload | null;
  startingMatch: boolean;
  onSelectServer: (serverId: string, doublesSetup?: DoublesSetup) => Promise<void>;
  onCloseServer: () => void;
  setSummaryMatch: DashboardMatchPayload | null;
  setSummaryTimelinePoints: TimelinePoint[];
  completedSetsCount: number;
  completedSetsData: CompletedSetsData;
  onCloseSetSummary: () => void;
  onResumeSetSummary: () => void;
  editMatch: DashboardMatchPayload | null;
  onCloseEditInfo: () => void;
  onSuccessEditInfo: () => void;
}
