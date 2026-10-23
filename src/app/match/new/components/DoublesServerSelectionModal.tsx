'use client';

import type { SelectablePlayer } from './ServerSelectionModal';
import type { DoublesSetup } from '@/schemas/contracts';
import { useDoublesServerSelection } from './use-doubles-server-selection';
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
  const p1Id = selectedP1?.id || '';
  const p1PartnerId = selectedP1Partner?.id || '';
  const p2Id = selectedP2?.id || '';
  const p2PartnerId = selectedP2Partner?.id || '';

  const {
    servingSide,
    setServingSide,
    activeFirstServerP1,
    activeFirstServerP2,
    activeReceiveDeuceP1,
    activeReceiveDeuceP2,
    setFirstServerP1,
    setFirstServerP2,
    setReceiveDeuceP1,
    setReceiveDeuceP2,
    buildConfirmation,
  } = useDoublesServerSelection({ p1Id, p1PartnerId, p2Id, p2PartnerId });

  if (!isOpen || !selectedP1 || !selectedP1Partner || !selectedP2 || !selectedP2Partner) {
    return null;
  }

  const handleConfirm = () => {
    const { initialServerId, setup } = buildConfirmation();
    onConfirmDoublesSetup(initialServerId, setup);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter') onClose();
        }}
      />
      <div className="relative bg-telemetry-elevated rounded-2xl shadow-2xl max-w-lg w-full p-6 text-left border border-white/10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-1 text-center">
          Formação Inicial de Duplas
        </h2>
        <p className="text-xs text-telemetry-text-muted mb-6 text-center">
          Defina quem começa sacando e a posição dos recebedores no 1º set
        </p>

        {/* 1. Dupla que começa sacando */}
        <DoublesServingSideSection
          servingSide={servingSide}
          onServingSideChange={setServingSide}
          selectedP1={selectedP1}
          selectedP1Partner={selectedP1Partner}
          selectedP2={selectedP2}
          selectedP2Partner={selectedP2Partner}
        />

        {/* 2. Ordem de saque */}
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

        {/* 3. Lado de Recepção (Deuce) */}
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
      </div>
    </div>
  );
}
