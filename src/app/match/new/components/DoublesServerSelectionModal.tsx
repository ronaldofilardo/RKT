'use client';

import type { SelectablePlayer } from './ServerSelectionModal';
import type { DoublesSetup } from '@/schemas/contracts';
import { useDoublesServerSelection } from './use-doubles-server-selection';
import { DoublesModalFrame } from './doubles-modal-frame';
import { DoublesServingSideSection } from './doubles-serving-side-section';
import { DoublesServeOrderSection } from './doubles-serve-order-section';
import { DoublesReceiveSideSection } from './doubles-receive-side-section';
import { DoublesConfirmButton } from './doubles-confirm-button';

interface DoublesServerSelectionModalProps {
  isOpen: boolean;
  selectedP1: SelectablePlayer | null;
  selectedP1Partner: SelectablePlayer | null;
  selectedP2: SelectablePlayer | null;
  selectedP2Partner: SelectablePlayer | null;
  startingMatch: boolean;
  onConfirmDoublesSetup: (initialServerId: string, setup: DoublesSetup) => void;
  onClose: () => void;
}

export function DoublesServerSelectionModal({
  isOpen,
  selectedP1,
  selectedP1Partner,
  selectedP2,
  selectedP2Partner,
  startingMatch,
  onConfirmDoublesSetup,
  onClose,
}: DoublesServerSelectionModalProps) {
  const {
    servingSide, setServingSide, activeFirstServerP1, activeFirstServerP2,
    activeReceiveDeuceP1, activeReceiveDeuceP2, setFirstServerP1, setFirstServerP2,
    setReceiveDeuceP1, setReceiveDeuceP2, buildConfirmation,
  } = useDoublesServerSelection({ selectedP1, selectedP1Partner, selectedP2, selectedP2Partner });

  if (!isOpen || !selectedP1 || !selectedP1Partner || !selectedP2 || !selectedP2Partner) return null;

  const handleConfirm = () => {
    const { initialServerId, setup } = buildConfirmation();
    onConfirmDoublesSetup(initialServerId, setup);
  };

  return (
    <DoublesModalFrame
      onClose={onClose}
      title="Formação Inicial de Duplas"
      subtitle="Defina quem começa sacando e a posição dos recebedores no 1º set"
    >
      <DoublesServingSideSection
        servingSide={servingSide}
        onServingSideChange={setServingSide}
        selectedP1={selectedP1}
        selectedP1Partner={selectedP1Partner}
        selectedP2={selectedP2}
        selectedP2Partner={selectedP2Partner}
      />
      <DoublesServeOrderSection
        activeFirstServerP1={activeFirstServerP1}
        activeFirstServerP2={activeFirstServerP2}
        onFirstServerP1={setFirstServerP1}
        onFirstServerP2={setFirstServerP2}
        selectedP1={selectedP1}
        selectedP1Partner={selectedP1Partner}
        selectedP2={selectedP2}
        selectedP2Partner={selectedP2Partner}
      />
      <DoublesReceiveSideSection
        activeReceiveDeuceP1={activeReceiveDeuceP1}
        activeReceiveDeuceP2={activeReceiveDeuceP2}
        onReceiveDeuceP1={setReceiveDeuceP1}
        onReceiveDeuceP2={setReceiveDeuceP2}
        selectedP1={selectedP1}
        selectedP1Partner={selectedP1Partner}
        selectedP2={selectedP2}
        selectedP2Partner={selectedP2Partner}
      />
      <DoublesConfirmButton startingMatch={startingMatch} onConfirm={handleConfirm} />
    </DoublesModalFrame>
  );
}
