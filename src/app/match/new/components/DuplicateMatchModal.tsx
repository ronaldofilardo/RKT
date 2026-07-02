'use client';

interface DuplicateMatchModalProps {
  isOpen: boolean;
  existingMatch: {
    id: string;
    playerP1?: string;
    playerP2?: string;
  } | null;
  onGoToMatch: (id: string) => void;
  onForceCreate: () => void;
  onCancel: () => void;
}

export function DuplicateMatchModal({
  isOpen,
  existingMatch,
  onGoToMatch,
  onForceCreate,
  onCancel,
}: DuplicateMatchModalProps) {
  if (!isOpen || !existingMatch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <div className="text-5xl mb-4">🤝</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Partida já existe</h2>
        <p className="text-sm text-gray-600 mb-1">
          Já existe uma partida entre{' '}
          <strong>{existingMatch.playerP1 ?? 'Jogador 1'}</strong> e{' '}
          <strong>{existingMatch.playerP2 ?? 'Jogador 2'}</strong>{' '}
          no horário informado.
        </p>
        <p className="text-xs text-gray-400 mb-6">
          ID: {existingMatch.id}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onGoToMatch(existingMatch.id)}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all active:scale-95"
          >
            Ir para aquela partida
          </button>
          <button
            type="button"
            onClick={onForceCreate}
            className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            Criar mesmo assim
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}