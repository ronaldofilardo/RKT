'use client';

import { NewAthleteModal, ServerSelectionModal, DuplicateMatchModal } from './index';
import type { Athlete } from '../types';

type NewMatchModalsProps = {
  showNewAthleteModal: boolean;
  showServerModal: boolean;
  showDuplicateModal: boolean;
  selectedP1: Athlete | null;
  selectedP2: Athlete | null;
  startingMatch: boolean;
  duplicateInfo: { id: string; playerP1?: string; playerP2?: string } | null;
  onAthleteClose: () => void;
  onAthleteCreated: (athlete: Athlete) => void;
  onSelectServer: (serverId: string) => void;
  onServerClose: () => void;
  onGoToMatch: (id: string) => void;
  onForceCreate: () => void;
  onDuplicateCancel: () => void;
};

export function NewMatchModals({ showNewAthleteModal, showServerModal, showDuplicateModal, selectedP1, selectedP2, startingMatch, duplicateInfo, onAthleteClose, onAthleteCreated, onSelectServer, onServerClose, onGoToMatch, onForceCreate, onDuplicateCancel }: NewMatchModalsProps) {
  return <><NewAthleteModal isOpen={showNewAthleteModal} onClose={onAthleteClose} onCreated={onAthleteCreated} /><ServerSelectionModal isOpen={showServerModal} selectedP1={selectedP1} selectedP2={selectedP2} startingMatch={startingMatch} onSelectServer={onSelectServer} onClose={onServerClose} /><DuplicateMatchModal isOpen={showDuplicateModal} existingMatch={duplicateInfo} onGoToMatch={onGoToMatch} onForceCreate={onForceCreate} onCancel={onDuplicateCancel} /></>;
}
