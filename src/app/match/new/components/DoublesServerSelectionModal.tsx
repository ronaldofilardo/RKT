'use client';

import type { SelectablePlayer } from './ServerSelectionModal';
import type { DoublesSetup } from '@/schemas/contracts';
import { useDoublesServerSelection } from './use-doubles-server-selection';
import { DoublesServingSideSection } from './doubles-serving-side-section';
import { DoublesServeOrderSection } from './doubles-serve-order-section';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Recepção Deuce Dupla 1 */}
          <div className="p-3 bg-telemetry-card rounded-xl border border-sky-500/20 space-y-2">
            <span className="text-xs font-bold text-sky-400 block">
              Recebedor no Deuce (Lado Direito) - Dupla 1
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setReceiveDeuceP1(p1Id)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeReceiveDeuceP1 === p1Id
                    ? 'bg-telemetry-blue text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                Deuce: {selectedP1.name}
              </button>
              <button
                type="button"
                onClick={() => setReceiveDeuceP1(p1PartnerId)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeReceiveDeuceP1 === p1PartnerId
                    ? 'bg-telemetry-blue text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                Deuce: {selectedP1Partner.name}
              </button>
            </div>
          </div>

          {/* Recepção Deuce Dupla 2 */}
          <div className="p-3 bg-telemetry-card rounded-xl border border-emerald-500/20 space-y-2">
            <span className="text-xs font-bold text-emerald-400 block">
              Recebedor no Deuce (Lado Direito) - Dupla 2
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setReceiveDeuceP2(p2Id)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeReceiveDeuceP2 === p2Id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                Deuce: {selectedP2.name}
              </button>
              <button
                type="button"
                onClick={() => setReceiveDeuceP2(p2PartnerId)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeReceiveDeuceP2 === p2PartnerId
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                Deuce: {selectedP2Partner.name}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={startingMatch}
          className="w-full py-3.5 px-4 bg-telemetry-blue hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl text-base transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {startingMatch ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
              <span>Iniciando Partida...</span>
            </>
          ) : (
            <span>Confirmar e Iniciar Partida</span>
          )}
        </button>
      </div>
    </div>
  );
}
