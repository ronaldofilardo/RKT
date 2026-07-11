'use client';

import { useState } from 'react';

interface DeleteMatchModalProps {
  matchId: string;
  matchState: string;
  matchNickname?: string;
  player1Name: string;
  player2Name: string;
  pointsCount?: number;
  annotationSessionsCount?: number;
  onConfirm: (type: 'soft' | 'hard', reason?: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteMatchModal({
  matchId,
  matchState,
  matchNickname,
  player1Name,
  player2Name,
  pointsCount = 0,
  annotationSessionsCount = 0,
  onConfirm,
  onCancel,
  loading,
}: DeleteMatchModalProps) {
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');
  const [reason, setReason] = useState('');
  const [showJustification, setShowJustification] = useState(false);

  const isFinished = matchState === 'FINISHED';
  const hasPoints = pointsCount > 0;
  const canHardDelete = !isFinished && !hasPoints;

  const handleConfirm = async () => {
    await onConfirm(deleteType, showJustification ? reason || undefined : undefined);
  };

  const matchLabel = matchNickname || `${player1Name} vs ${player2Name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Excluir Partida
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {matchLabel}
        </p>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Tipo de exclusão:
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <input
                type="radio"
                name="deleteType"
                value="soft"
                checked={deleteType === 'soft'}
                onChange={() => setDeleteType('soft')}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="block font-semibold text-gray-900 dark:text-gray-100">
                  Soft Delete (Recomendado)
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Marca como cancelada, mantém histórico
                </span>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
              canHardDelete
                ? 'border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500'
                : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
            }`}>
              <input
                type="radio"
                name="deleteType"
                value="hard"
                checked={deleteType === 'hard'}
                onChange={() => setDeleteType('hard')}
                className="mt-1"
                disabled={!canHardDelete}
              />
              <div className="flex-1">
                <span className="block font-semibold text-gray-900 dark:text-gray-100">
                  Hard Delete (Permanente)
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Apaga completamente do banco de dados
                </span>
              </div>
            </label>
          </div>
        </div>

        {deleteType === 'hard' && (hasPoints || annotationSessionsCount > 0) && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-semibold mb-2">
              ⚠️ Esta partida será permanentemente apagada:
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              {pointsCount > 0 && (
                <li>• {pointsCount} evento(s) de pontuação</li>
              )}
              {annotationSessionsCount > 0 && (
                <li>• {annotationSessionsCount} sessão(ões) de anotação</li>
              )}
            </ul>
          </div>
        )}

        {deleteType === 'soft' && isFinished && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ Partidas finalizadas só podem ser marcadas como canceladas (soft delete).
            </p>
          </div>
        )}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowJustification(!showJustification)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {showJustification ? 'Ocultar justificativa' : 'Deseja justificar? (opcional)'}
          </button>
          {showJustification && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo da exclusão..."
              maxLength={500}
              rows={3}
              className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (deleteType === 'hard' && !canHardDelete)}
            className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all ${
              deleteType === 'hard'
                ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-red-800 text-white'
                : 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:disabled:bg-orange-800 text-white'
            }`}
          >
            {loading
              ? deleteType === 'hard'
                ? 'Excluindo...'
                : 'Cancelando...'
              : deleteType === 'hard'
              ? 'Excluir Permanentemente'
              : 'Marcar como Cancelada'}
          </button>
        </div>
      </div>
    </div>
  );
}