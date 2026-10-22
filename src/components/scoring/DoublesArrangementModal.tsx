'use client';

import { useState } from 'react';
import type { DoublesArrangement } from '@/core/scoring/types';

export interface DoublesArrangementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (arrangement: DoublesArrangement) => Promise<void> | void;
  player1: { id: string; name: string };
  player1Partner: { id: string; name: string };
  player2: { id: string; name: string };
  player2Partner: { id: string; name: string };
  currentArrangement?: DoublesArrangement | null;
  currentSetIndex?: number;
}

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
          <div className="p-3.5 bg-telemetry-elevated/40 border border-white/10 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-telemetry-blue-light uppercase tracking-wider">
              {player1.name} / {player1Partner.name}
            </h3>
            
            <div>
              <label className="text-[11px] text-telemetry-text-muted block mb-1.5 font-medium">
                Primeiro a sacar no set:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setP1Server(player1.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p1Server === player1.id
                      ? 'bg-telemetry-blue/20 border-telemetry-blue text-white ring-1 ring-telemetry-blue/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  🎾 {player1.name}
                </button>
                <button
                  type="button"
                  onClick={() => setP1Server(player1Partner.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p1Server === player1Partner.id
                      ? 'bg-telemetry-blue/20 border-telemetry-blue text-white ring-1 ring-telemetry-blue/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  🎾 {player1Partner.name}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-telemetry-text-muted block mb-1.5 font-medium">
                Recebe na quadra de iguais (lado direito):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setP1Receiver(player1.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p1Receiver === player1.id
                      ? 'bg-telemetry-blue/20 border-telemetry-blue text-white ring-1 ring-telemetry-blue/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  {player1.name}
                </button>
                <button
                  type="button"
                  onClick={() => setP1Receiver(player1Partner.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p1Receiver === player1Partner.id
                      ? 'bg-telemetry-blue/20 border-telemetry-blue text-white ring-1 ring-telemetry-blue/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  {player1Partner.name}
                </button>
              </div>
            </div>
          </div>

          {/* Lado B */}
          <div className="p-3.5 bg-telemetry-elevated/40 border border-white/10 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-telemetry-orange-light uppercase tracking-wider">
              {player2.name} / {player2Partner.name}
            </h3>
            
            <div>
              <label className="text-[11px] text-telemetry-text-muted block mb-1.5 font-medium">
                Primeiro a sacar no set:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setP2Server(player2.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p2Server === player2.id
                      ? 'bg-telemetry-orange/20 border-telemetry-orange text-white ring-1 ring-telemetry-orange/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  🎾 {player2.name}
                </button>
                <button
                  type="button"
                  onClick={() => setP2Server(player2Partner.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p2Server === player2Partner.id
                      ? 'bg-telemetry-orange/20 border-telemetry-orange text-white ring-1 ring-telemetry-orange/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  🎾 {player2Partner.name}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-telemetry-text-muted block mb-1.5 font-medium">
                Recebe na quadra de iguais (lado direito):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setP2Receiver(player2.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p2Receiver === player2.id
                      ? 'bg-telemetry-orange/20 border-telemetry-orange text-white ring-1 ring-telemetry-orange/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  {player2.name}
                </button>
                <button
                  type="button"
                  onClick={() => setP2Receiver(player2Partner.id)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
                    p2Receiver === player2Partner.id
                      ? 'bg-telemetry-orange/20 border-telemetry-orange text-white ring-1 ring-telemetry-orange/50'
                      : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
                  }`}
                >
                  {player2Partner.name}
                </button>
              </div>
            </div>
          </div>
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
