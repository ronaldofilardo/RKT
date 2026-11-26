'use client';

import { SetSummaryModal } from '@/components/scoring/SetSummaryModal';
import { EditMatchInfoModal } from '@/components/dashboard/EditMatchInfoModal';
import { CommentModal } from '@/components/scoring/CommentModal';
import { ConfirmDeleteMatchDialog } from './ConfirmDeleteMatchDialog';
import { ServerSelectionBlock } from './dashboard-server-modal';
import { abbreviateDoublesName } from '@/components/scoring/doubles-name-abbreviation.logic';

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

      <ServerSelectionBlock
        serverMatch={serverMatch}
        startingMatch={startingMatch}
        onSelectServer={onSelectServer}
        onCloseServer={onCloseServer}
      />

      {setSummaryMatch && (
        <SetSummaryModal
          isOpen={Boolean(setSummaryMatch)}
          onClose={onCloseSetSummary}
          onResumeMatch={onResumeSetSummary}
          timelinePoints={setSummaryTimelinePoints}
          player1Name={setSummaryMatch.matchType === 'DOUBLES'
            ? abbreviateDoublesName(setSummaryMatch.player1?.name ?? 'Jogador 1', setSummaryMatch.player1Partner?.name)
            : (setSummaryMatch.player1?.name ?? 'Jogador 1')}
          player2Name={setSummaryMatch.matchType === 'DOUBLES'
            ? abbreviateDoublesName(setSummaryMatch.player2?.name ?? 'Jogador 2', setSummaryMatch.player2Partner?.name)
            : (setSummaryMatch.player2?.name ?? 'Jogador 2')}
          initialSetNumber={completedSetsCount || 1}
          completedSetsCount={completedSetsCount}
          isMatchFinished={setSummaryMatch.state === 'FINISHED'}
          completedSetsData={completedSetsData}
          format={setSummaryMatch.format as any}
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
