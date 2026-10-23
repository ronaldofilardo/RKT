'use client';

import type { DoublesArrangementModalProps } from './doubles-arrangement-modal.types';
import { DoublesArrangementSide } from './doubles-arrangement-side';
import { useDoublesArrangement } from './use-doubles-arrangement';

export type { DoublesArrangementModalProps } from './doubles-arrangement-modal.types';

export function DoublesArrangementModal({
  isOpen,
  onClose,
  onConfirm,
  player1,
  player1Partner,
  player2,
  player2Partner,
  currentArrangement,
  currentSetIndex = 1,
}: DoublesArrangementModalProps) {
  const {
    p1Server, setP1Server, p2Server, setP2Server,
    p1Receiver, setP1Receiver, p2Receiver, setP2Receiver,
    isSubmitting, handleConfirm,
  } = useDoublesArrangement({
    onConfirm, onClose, player1, player1Partner, player2, player2Partner,
    currentArrangement,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doubles-arrangement-title"
      className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-telemetry-card border border-white/15 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-telemetry-text-primary">
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03]">
          <h2 id="doubles-arrangement-title" className="text-base font-bold text-white flex items-center gap-2">
            <span>👥</span> Formação das Duplas (Set {currentSetIndex + 1})
          </h2>
          <p className="text-xs text-telemetry-text-muted mt-1">
            Defina quem saca primeiro e quem recebe na quadra de iguais para cada equipe.
          </p>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {/* Lado A */}
          <DoublesArrangementSide
            accent="blue"
            player={player1}
            partner={player1Partner}
            server={p1Server}
            setServer={setP1Server}
            receiver={p1Receiver}
            setReceiver={setP1Receiver}
          />

          {/* Lado B */}
          <DoublesArrangementSide
            accent="orange"
            player={player2}
            partner={player2Partner}
            server={p2Server}
            setServer={setP2Server}
            receiver={p2Receiver}
            setReceiver={setP2Receiver}
          />
        </div>

        <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-telemetry-text-muted transition-colors"
          >
            Manter Como Está
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-telemetry-blue hover:bg-telemetry-blue-light text-white shadow-md shadow-telemetry-blue/20 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar Formação'}
          </button>
        </div>
      </div>
    </div>
  );
}
