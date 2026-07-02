'use client';

interface UndoConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  pointDescription?: string;
}

export function UndoConfirmModal({ onConfirm, onCancel, loading, pointDescription }: UndoConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Desfazer ponto?</h2>
        {pointDescription && (
          <p className="text-sm text-gray-500 mb-6">{pointDescription}</p>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold rounded-xl transition-all">
            {loading ? 'Desfazendo...' : 'Desfazer'}
          </button>
        </div>
      </div>
    </div>
  );
}
