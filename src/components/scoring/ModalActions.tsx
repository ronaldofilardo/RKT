'use client';

interface ModalActionsProps {
  canConfirm: boolean;
  noteText: string;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenNotes: () => void;
}

export function ModalActions({
  canConfirm,
  noteText,
  onConfirm,
  onCancel,
  onOpenNotes,
}: ModalActionsProps) {
  return (
    <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
      <button
        onClick={onOpenNotes}
        className="w-full py-2 rounded-xl font-bold text-sm bg-transparent text-gray-300 border border-white/15 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Observações
        {noteText.trim() && <span className="text-blue-400">📝</span>}
      </button>
      <button
        onClick={onConfirm}
        disabled={!canConfirm}
        className={`w-full py-2.5 rounded-xl font-bold transition-all text-sm ${
          canConfirm
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
            : 'bg-blue-900/40 text-blue-300/40 cursor-not-allowed'
        }`}
      >
        Confirmar Ponto
      </button>
      <button
        onClick={onCancel}
        className="w-full py-2.5 rounded-xl font-bold text-sm bg-transparent text-red-400 border-2 border-red-400/60 hover:bg-red-500/10 hover:border-red-400 transition-all"
      >
        Cancelar
      </button>
    </div>
  );
}