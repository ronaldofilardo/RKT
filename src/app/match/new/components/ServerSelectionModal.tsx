'use client';

import { Athlete } from '../page';

interface ServerSelectionModalProps {
  isOpen: boolean;
  selectedP1: Athlete | null;
  selectedP2: Athlete | null;
  startingMatch: boolean;
  onSelectServer: (serverId: string) => void;
  onClose: () => void;
}

export function ServerSelectionModal({
  isOpen,
  selectedP1,
  selectedP2,
  startingMatch,
  onSelectServer,
  onClose,
}: ServerSelectionModalProps) {
  if (!isOpen || !selectedP1 || !selectedP2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quem saca primeiro?</h2>
        <p className="text-sm text-gray-500 mb-6">Selecione o jogador que fará o primeiro saque</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onSelectServer(selectedP1.id)}
            disabled={startingMatch}
            className="w-full py-4 px-4 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold rounded-xl text-lg transition-all active:scale-95"
          >
            {selectedP1.name}
          </button>
          <button
            type="button"
            onClick={() => onSelectServer(selectedP2.id)}
            disabled={startingMatch}
            className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold rounded-xl text-lg transition-all active:scale-95"
          >
            {selectedP2.name}
          </button>
        </div>
        {startingMatch && (
          <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600" />
            <span className="text-sm">Iniciando partida...</span>
          </div>
        )}
      </div>
    </div>
  );
}