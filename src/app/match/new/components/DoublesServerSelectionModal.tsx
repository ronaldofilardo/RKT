'use client';

import { useState } from 'react';
import type { SelectablePlayer } from './ServerSelectionModal';
import type { DoublesSetup } from '@/schemas/contracts';

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
  // Step 1: Qual dupla começa sacando? ('player1' ou 'player2')
  const [servingSide, setServingSide] = useState<'player1' | 'player2'>('player1');
  // Step 2: Quem saca primeiro na Dupla 1?
  const [firstServerP1, setFirstServerP1] = useState<string>('');
  // Step 2: Quem saca primeiro na Dupla 2?
  const [firstServerP2, setFirstServerP2] = useState<string>('');
  // Step 3: Quem recebe no Deuce na Dupla 1?
  const [receiveDeuceP1, setReceiveDeuceP1] = useState<string>('');
  // Step 3: Quem recebe no Deuce na Dupla 2?
  const [receiveDeuceP2, setReceiveDeuceP2] = useState<string>('');

  if (!isOpen || !selectedP1 || !selectedP1Partner || !selectedP2 || !selectedP2Partner) {
    return null;
  }

  const p1Id = selectedP1.id || '';
  const p1PartnerId = selectedP1Partner.id || '';
  const p2Id = selectedP2.id || '';
  const p2PartnerId = selectedP2Partner.id || '';

  // Inicializadores automáticos se vazios
  const activeFirstServerP1 = firstServerP1 || p1Id;
  const activeFirstServerP2 = firstServerP2 || p2Id;
  const activeReceiveDeuceP1 = receiveDeuceP1 || p1Id;
  const activeReceiveDeuceP2 = receiveDeuceP2 || p2Id;

  const secondServerP1 = activeFirstServerP1 === p1Id ? p1PartnerId : p1Id;
  const secondServerP2 = activeFirstServerP2 === p2Id ? p2PartnerId : p2Id;

  const handleConfirm = () => {
    const initialServerId = servingSide === 'player1' ? activeFirstServerP1 : activeFirstServerP2;
    const setup: DoublesSetup = {
      serveOrder: {
        player1: [activeFirstServerP1, secondServerP1],
        player2: [activeFirstServerP2, secondServerP2],
      },
      receiveDeuce: {
        player1: activeReceiveDeuceP1,
        player2: activeReceiveDeuceP2,
      },
      changes: [],
    };
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
        <div className="mb-5 space-y-2">
          <label className="text-xs font-bold text-telemetry-text-muted uppercase tracking-wider block">
            1. Qual dupla começa no saque?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setServingSide('player1')}
              className={`p-3 rounded-xl border text-left transition-all ${
                servingSide === 'player1'
                  ? 'border-sky-500 bg-sky-500/10 text-white font-semibold'
                  : 'border-white/10 hover:border-white/20 text-telemetry-text-muted'
              }`}
            >
              <div className="text-xs font-bold text-sky-400 mb-0.5">Dupla 1</div>
              <div className="text-sm truncate font-medium text-telemetry-text-primary">
                {selectedP1.name} &amp; {selectedP1Partner.name}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setServingSide('player2')}
              className={`p-3 rounded-xl border text-left transition-all ${
                servingSide === 'player2'
                  ? 'border-emerald-500 bg-emerald-500/10 text-white font-semibold'
                  : 'border-white/10 hover:border-white/20 text-telemetry-text-muted'
              }`}
            >
              <div className="text-xs font-bold text-emerald-400 mb-0.5">Dupla 2</div>
              <div className="text-sm truncate font-medium text-telemetry-text-primary">
                {selectedP2.name} &amp; {selectedP2Partner.name}
              </div>
            </button>
          </div>
        </div>

        {/* 2. Ordem de saque */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Sacador 1 da Dupla 1 */}
          <div className="p-3 bg-telemetry-card rounded-xl border border-sky-500/20 space-y-2">
            <span className="text-xs font-bold text-sky-400 block">
              Quem saca 1º na Dupla 1?
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setFirstServerP1(p1Id)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeFirstServerP1 === p1Id
                    ? 'bg-telemetry-blue text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                1º: {selectedP1.name}
              </button>
              <button
                type="button"
                onClick={() => setFirstServerP1(p1PartnerId)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeFirstServerP1 === p1PartnerId
                    ? 'bg-telemetry-blue text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                1º: {selectedP1Partner.name}
              </button>
            </div>
          </div>

          {/* Sacador 1 da Dupla 2 */}
          <div className="p-3 bg-telemetry-card rounded-xl border border-emerald-500/20 space-y-2">
            <span className="text-xs font-bold text-emerald-400 block">
              Quem saca 1º na Dupla 2?
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setFirstServerP2(p2Id)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeFirstServerP2 === p2Id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                1º: {selectedP2.name}
              </button>
              <button
                type="button"
                onClick={() => setFirstServerP2(p2PartnerId)}
                className={`py-2 px-3 text-xs rounded-lg text-left transition-all ${
                  activeFirstServerP2 === p2PartnerId
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
                }`}
              >
                1º: {selectedP2Partner.name}
              </button>
            </div>
          </div>
        </div>

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
