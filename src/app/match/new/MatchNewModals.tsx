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
  handleAthleteCreated: (athlete: Athlete) => void;
  showServerModal: boolean;
  setShowServerModal: (v: boolean) => void;
  selectedP1: SelectablePlayer | null;
  selectedP2: SelectablePlayer | null;
  startingMatch: boolean;
  handleSelectServer: (serverId: string) => void;
  showDuplicateModal: boolean;
  setShowDuplicateModal: (v: boolean) => void;
  duplicateInfo: { id: string; playerP1?: string; playerP2?: string } | null;
  handleForceCreate: () => void;
}

/** Modais da página: novo atleta, seleção de sacador e partida duplicada. */
export function MatchNewModals({
  router,
  showNewAthleteModal,
  setShowNewAthleteModal,
  handleAthleteCreated,
  showServerModal,
  setShowServerModal,
  selectedP1,
  selectedP2,
  startingMatch,
  handleSelectServer,
  showDuplicateModal,
  setShowDuplicateModal,
  duplicateInfo,
  handleForceCreate,
}: MatchNewModalsProps) {
  return (
    <>
      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={handleAthleteCreated}
      />

      <ServerSelectionModal
        isOpen={showServerModal}
        selectedP1={selectedP1}
        selectedP2={selectedP2}
        startingMatch={startingMatch}
        onSelectServer={handleSelectServer}
        onClose={() => setShowServerModal(false)}
      />

      <DuplicateMatchModal
        isOpen={showDuplicateModal}
        existingMatch={duplicateInfo}
        onGoToMatch={(id) => router.push(`/match/${id}/scoring`)}
        onForceCreate={handleForceCreate}
        onCancel={() => setShowDuplicateModal(false)}
      />
    </>
  );
}
