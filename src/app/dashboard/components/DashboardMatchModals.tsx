'use client';

import type { ComponentProps } from 'react';
import { ServerSelectionModal } from '@/app/match/new/components/ServerSelectionModal';
import { DoublesServerSelectionModal } from '@/app/match/new/components/DoublesServerSelectionModal';
import type { DoublesSetup } from '@/schemas/contracts';
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

      {serverMatch && serverMatch.matchType === 'DOUBLES' ? (
        <DoublesServerSelectionModal
          isOpen={Boolean(serverMatch)}
          selectedP1={serverMatch.player1}
          selectedP1Partner={serverMatch.player1Partner ?? null}
          selectedP2={serverMatch.player2}
          selectedP2Partner={serverMatch.player2Partner ?? null}
          startingMatch={startingMatch}
          onConfirmDoublesSetup={(initialServerId, setup) => onSelectServer(initialServerId, setup)}
          onClose={onCloseServer}
        />
      ) : serverMatch ? (
        <ServerSelectionModal
          isOpen={Boolean(serverMatch)}
          selectedP1={serverMatch.player1}
          selectedP2={serverMatch.player2}
          startingMatch={startingMatch}
          onSelectServer={(serverId) => onSelectServer(serverId)}
          onClose={onCloseServer}
        />
      ) : null}

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
