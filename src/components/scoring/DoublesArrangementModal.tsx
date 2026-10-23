'use client';

import { useState } from 'react';
import type { DoublesArrangement } from '@/core/scoring/types';
import type { DoublesArrangementModalProps } from './doubles-arrangement-modal.types';
import { DoublesArrangementSide } from './doubles-arrangement-side';

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
  const defaultP1Server = currentArrangement?.serveOrder.player1[0] ?? player1.id;
  const defaultP2Server = currentArrangement?.serveOrder.player2[0] ?? player2.id;
  const defaultP1Receiver = currentArrangement?.receiveDeuce.player1 ?? player1.id;
  const defaultP2Receiver = currentArrangement?.receiveDeuce.player2 ?? player2.id;

  const [p1Server, setP1Server] = useState<string>(defaultP1Server);
  const [p2Server, setP2Server] = useState<string>(defaultP2Server);
  const [p1Receiver, setP1Receiver] = useState<string>(defaultP1Receiver);
  const [p2Receiver, setP2Receiver] = useState<string>(defaultP2Receiver);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const p1Second = p1Server === player1.id ? player1Partner.id : player1.id;
      const p2Second = p2Server === player2.id ? player2Partner.id : player2.id;

      const newArrangement: DoublesArrangement = {
        serveOrder: {
          player1: [p1Server, p1Second],
          player2: [p2Server, p2Second],
        },
        serveIndex: { player1: 0, player2: 0 },
        receiveDeuce: {
          player1: p1Receiver,
          player2: p2Receiver,
        },
      };

      await onConfirm(newArrangement);
      onClose();
    } catch (err) {
      console.error('[DoublesArrangementModal] Erro ao confirmar formação:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
