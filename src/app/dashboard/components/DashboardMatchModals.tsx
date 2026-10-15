'use client';

import type { ComponentProps } from 'react';
import { ServerSelectionModal } from '@/app/match/new/components/ServerSelectionModal';
import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
import { EditMatchInfoModal } from '@/components/dashboard/EditMatchInfoModal';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { TimelinePoint } from '@/core/scoring/types';
import type { DeletableMatch } from '../dashboard.types';
import { ConfirmDeleteMatchDialog } from './ConfirmDeleteMatchDialog';

type CompletedSetsData = ComponentProps<typeof SetSummaryModal>['completedSetsData'];

interface DashboardMatchModalsProps {
  matchToDelete: DeletableMatch | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  serverMatch: DashboardMatchPayload | null;
  startingMatch: boolean;
  onSelectServer: (serverId: string) => Promise<void>;
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

/** Modais do dashboard: exclusão, seleção de sacador, resumo de set e edição de infos. */
export function DashboardMatchModals({
  matchToDelete,
  onCancelDelete,
  onConfirmDelete,
  serverMatch,
  startingMatch,
  onSelectServer,
  onCloseServer,
  setSummaryMatch,
  setSummaryTimelinePoints,
  completedSetsCount,
  completedSetsData,
  onCloseSetSummary,
  onResumeSetSummary,
  editMatch,
  onCloseEditInfo,
  onSuccessEditInfo,
}: DashboardMatchModalsProps) {
  return (
    <>
      {matchToDelete && (
        <ConfirmDeleteMatchDialog onCancel={onCancelDelete} onConfirm={onConfirmDelete} />
      )}

      {serverMatch && (
        <ServerSelectionModal
          isOpen={Boolean(serverMatch)}
          selectedP1={serverMatch.player1}
          selectedP2={serverMatch.player2}
          startingMatch={startingMatch}
          onSelectServer={onSelectServer}
          onClose={onCloseServer}
        />
      )}

      {setSummaryMatch && (
        <SetSummaryModal
          isOpen={Boolean(setSummaryMatch)}
          onClose={onCloseSetSummary}
          onResumeMatch={onResumeSetSummary}
          timelinePoints={setSummaryTimelinePoints}
          player1Name={setSummaryMatch.player1?.name ?? 'Jogador 1'}
          player2Name={setSummaryMatch.player2?.name ?? 'Jogador 2'}
          initialSetNumber={completedSetsCount || 1}
          completedSetsCount={completedSetsCount}
          isMatchFinished={setSummaryMatch.state === 'FINISHED'}
          completedSetsData={completedSetsData}
        />
      )}

      {editMatch && (
        <EditMatchInfoModal
          match={editMatch}
          onClose={onCloseEditInfo}
          onSuccess={onSuccessEditInfo}
        />
      )}
    </>
  );
}
