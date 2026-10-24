'use client';

import { ServerSelectionModal } from '@/app/match/new/components/ServerSelectionModal';
import { DoublesServerSelectionModal } from '@/app/match/new/components/DoublesServerSelectionModal';
import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
import { EditMatchInfoModal } from '@/components/dashboard/EditMatchInfoModal';
import { CommentModal } from '@/components/scoring/CommentModal';
import { ConfirmDeleteMatchDialog } from './ConfirmDeleteMatchDialog';

import type { DashboardMatchModalsProps } from './dashboard-match-modals.types';

export type { DashboardMatchModalsProps, CompletedSetsData } from './dashboard-match-modals.types';

/** Modais do dashboard: exclusão, finalização com comentário, seleção de sacador, resumo de set e edição de infos. */
export function DashboardMatchModals({
  matchToDelete,
  onCancelDelete,
  onConfirmDelete,
  matchToFinish,
  onCancelFinish,
  onConfirmFinish,
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

      {matchToFinish && (
        <CommentModal
          isOpen={Boolean(matchToFinish)}
          title="Encerrar Partida - Comentário Final"
          onClose={onCancelFinish ?? (() => {})}
          onSave={onConfirmFinish ?? (() => {})}
        />
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
