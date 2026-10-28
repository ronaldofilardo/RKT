'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  NewAthleteModal,
  ServerSelectionModal,
  DoublesServerSelectionModal,
  DuplicateMatchModal,
} from './components';
import type { Athlete } from './types';
import type { SelectablePlayer } from './components/ServerSelectionModal';
import type { DoublesSetup } from '@/schemas/contracts';

interface MatchNewModalsProps {
  router: AppRouterInstance;
  showNewAthleteModal: boolean;
  setShowNewAthleteModal: (v: boolean) => void;
  onAthleteCreationComplete: (athlete: Athlete) => void;
  showServerModal: boolean;
  setShowServerModal: (v: boolean) => void;
  matchType?: 'SINGLES' | 'DOUBLES';
  selectedP1: SelectablePlayer | null;
  selectedP2: SelectablePlayer | null;
  selectedP1Partner?: SelectablePlayer | null;
  selectedP2Partner?: SelectablePlayer | null;
  startingMatch: boolean;
  selectServingPlayer: (serverId: string) => void;
  selectDoublesServingSetup?: (initialServerId: string, setup: DoublesSetup) => void;
  showDuplicateModal: boolean;
  setShowDuplicateModal: (v: boolean) => void;
  duplicateInfo: { id: string; playerP1?: string; playerP2?: string } | null;
  createMatchIgnoringWarning: () => void;
  myClub?: boolean;
  ctId?: string | null;
}

export function MatchNewModals({
  router,
  showNewAthleteModal,
  setShowNewAthleteModal,
  onAthleteCreationComplete,
  showServerModal,
  setShowServerModal,
  matchType = 'SINGLES',
  selectedP1,
  selectedP2,
  selectedP1Partner = null,
  selectedP2Partner = null,
  startingMatch,
  selectServingPlayer,
  selectDoublesServingSetup,
  showDuplicateModal,
  setShowDuplicateModal,
  duplicateInfo,
  createMatchIgnoringWarning,
  myClub = false,
  ctId = null,
}: MatchNewModalsProps) {
  const isDoubles = matchType === 'DOUBLES';
  return (
    <>
      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={onAthleteCreationComplete}
        myClub={myClub}
        ctId={ctId}
      />
      {!isDoubles ? (
        <ServerSelectionModal
          isOpen={showServerModal}
          selectedP1={selectedP1}
          selectedP2={selectedP2}
          startingMatch={startingMatch}
          onSelectServer={selectServingPlayer}
          onClose={() => setShowServerModal(false)}
        />
      ) : (
        <DoublesServerSelectionModal
          isOpen={showServerModal}
          selectedP1={selectedP1}
          selectedP1Partner={selectedP1Partner}
          selectedP2={selectedP2}
          selectedP2Partner={selectedP2Partner}
          startingMatch={startingMatch}
          onConfirmDoublesSetup={selectDoublesServingSetup || (() => {})}
          onClose={() => setShowServerModal(false)}
        />
      )}
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
