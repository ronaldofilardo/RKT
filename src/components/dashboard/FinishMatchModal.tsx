'use client';

import { useState } from 'react';
import { MatchFinishReason } from '@/schemas/contracts';

interface FinishMatchModalProps {
  matchId: string;
  matchState: string;
  matchNickname?: string;
  player1Name: string;
  player2Name: string;
  onConfirm: (reason: MatchFinishReason, note?: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const REASON_LABELS: Record<MatchFinishReason, string> = {
  COMPLETED: 'Partida completada normalmente',
  ABANDONED: 'Abandono durante a partida',
  WALKOVER: 'Walkover (adversário não compareceu)',
  INJURY: 'Lesão de jogador',
  OUTRO: 'Outro motivo',
};

export function FinishMatchModal({
  matchId,
  matchState,
  matchNickname,
  player1Name,
  player2Name,
  onConfirm,
  onCancel,
  loading,
}: FinishMatchModalProps) {
  const [reason, setReason] = useState<MatchFinishReason>('COMPLETED');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  const handleConfirm = async () => {
    await onConfirm(reason, showNote ? note || undefined : undefined);
  };

  const matchLabel = matchNickname || `${player1Name} vs ${player2Name}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Encerrar Partida
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {matchLabel}
        </p>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Motivo do encerramento:
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as MatchFinishReason)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          >
            {Object.entries(REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {reason !== 'COMPLETED' && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Esta partida será encerrada sem conclusão normal.
            </p>
          </div>
        )}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowNote(!showNote)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {showNote ? 'Ocultar nota' : 'Deseja adicionar uma nota? (opcional)'}
          </button>
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo pessoal do encerramento..."
              maxLength={500}
              rows={3}
              className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
            disabled={loading}
            className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-green-800 text-white font-semibold rounded-xl transition-all"
          >
            {loading ? 'Encerrando...' : 'Encerrar Partida'}
          </button>
        </div>
      </div>
    </div>
  );
}