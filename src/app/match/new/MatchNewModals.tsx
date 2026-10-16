'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  NewAthleteModal,
  ServerSelectionModal,
  DuplicateMatchModal,
} from './components';
import type { Athlete } from './types';
import type { SelectablePlayer } from './components/ServerSelectionModal';

interface MatchNewModalsProps {
  router: AppRouterInstance;
  showNewAthleteModal: boolean;
  setShowNewAthleteModal: (v: boolean) => void;
  onAthleteCreationComplete: (athlete: Athlete) => void;
  showServerModal: boolean;
  setShowServerModal: (v: boolean) => void;
  selectedP1: SelectablePlayer | null;
  selectedP2: SelectablePlayer | null;
  startingMatch: boolean;
  selectServingPlayer: (serverId: string) => void;
  showDuplicateModal: boolean;
  setShowDuplicateModal: (v: boolean) => void;
  duplicateInfo: { id: string; playerP1?: string; playerP2?: string } | null;
  createMatchIgnoringWarning: () => void;
}

/** Modais da página: novo atleta, seleção de sacador e partida duplicada. */
export function MatchNewModals({
  router,
  showNewAthleteModal,
  setShowNewAthleteModal,
  onAthleteCreationComplete,
  showServerModal,
  setShowServerModal,
  selectedP1,
  selectedP2,
  startingMatch,
  selectServingPlayer,
  showDuplicateModal,
  setShowDuplicateModal,
  duplicateInfo,
  createMatchIgnoringWarning,
}: MatchNewModalsProps) {
  return (
    <>
      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={onAthleteCreationComplete}
      />

      <ServerSelectionModal
        isOpen={showServerModal}
        selectedP1={selectedP1}
        selectedP2={selectedP2}
        startingMatch={startingMatch}
        onSelectServer={selectServingPlayer}
        onClose={() => setShowServerModal(false)}
      />

      <DuplicateMatchModal
        isOpen={showDuplicateModal}
        existingMatch={duplicateInfo}
        onGoToMatch={(id) => router.push(`/match/${id}/scoring`)}
        onForceCreate={createMatchIgnoringWarning}
        onCancel={() => setShowDuplicateModal(false)}
      />
    </>
  );
}
