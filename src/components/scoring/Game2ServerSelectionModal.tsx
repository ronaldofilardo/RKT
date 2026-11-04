'use client';

import { useState } from 'react';
import { abbreviatePlayerName } from './doubles-name-abbreviation.logic';

interface Game2ServerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  currentServerId?: string | null;
  onSelectServer: (serverId: string) => Promise<unknown> | void;
}

export function Game2ServerSelectionModal({
  isOpen,
  onClose,
  teamName,
  player1,
  player2,
  currentServerId,
  onSelectServer,
}: Game2ServerSelectionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (serverId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSelectServer(serverId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-telemetry-card border border-white/10 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-telemetry-volt/20 text-xl mb-1">
            🎾
          </div>
          <h3 className="text-base font-bold text-telemetry-text-primary">
            Game 2 — Quem vai sacar?
          </h3>
          <p className="text-xs text-telemetry-text-muted">
            Defina o 1º sacador de <strong className="text-telemetry-volt">{teamName}</strong> (Regra 14 ITF):
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleSelect(player1.id)}
            disabled={isSubmitting}
            className={`py-3 px-4 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between ${
              currentServerId === player1.id
                ? 'bg-telemetry-volt text-black ring-2 ring-white/50 shadow-md shadow-telemetry-volt/20'
                : 'bg-telemetry-elevated text-white hover:bg-telemetry-volt/10'
            }`}
          >
            <span>{abbreviatePlayerName(player1.name)}</span>
            {currentServerId === player1.id && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-black uppercase">
                Atual
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelect(player2.id)}
            disabled={isSubmitting}
            className={`py-3 px-4 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between ${
              currentServerId === player2.id
                ? 'bg-telemetry-volt text-black ring-2 ring-white/50 shadow-md shadow-telemetry-volt/20'
                : 'bg-telemetry-elevated text-white hover:bg-telemetry-volt/10'
            }`}
          >
            <span>{abbreviatePlayerName(player2.name)}</span>
            {currentServerId === player2.id && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white font-black uppercase">
                Atual
              </span>
            )}
          </button>
        </div>

        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[11px] text-telemetry-text-muted hover:text-white transition-colors"
          >
            Manter sacador atual
          </button>
        </div>
      </div>
    </div>
  );
}
