'use client';

import { useState, useEffect } from 'react';
import type { ClubMatchItem, CoachItem } from './types';

export interface IndicarAnotadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: ClubMatchItem | null;
  coaches: CoachItem[];
  onSuccess: () => void;
}

export function IndicarAnotadorModal({ open, onOpenChange, match, coaches, onSuccess }: IndicarAnotadorModalProps) {
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      setSelectedCoachId(match.assignedCoachId || coaches[0]?.user.id || '');
      setError(null);
    }
  }, [match, coaches]);

  if (!open || !match) return null;

  async function handleConfirm() {
    if (!selectedCoachId) { setError('Selecione um treinador ou anotador.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/gestor/matches/${match!.id}/assign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coachUserId: selectedCoachId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao indicar anotador');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  const matchTitle = `${match.player1?.name || 'Jogador 1'} × ${match.player2?.name || 'Jogador 2'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-telemetry-card border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div>
          <h2 className="text-lg font-bold text-telemetry-text-primary">Indicar Anotador do Clube</h2>
          <p className="text-xs text-telemetry-text-muted mt-0.5">{matchTitle}</p>
        </div>
        {error && (
          <div className="p-2.5 rounded bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-xs">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="coach-select" className="text-xs font-semibold text-telemetry-text-muted block">Membro anotador ou treinador</label>
          <select
            id="coach-select"
            value={selectedCoachId}
            onChange={(e) => setSelectedCoachId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-telemetry-elevated text-telemetry-text-primary text-sm focus:outline-none focus:border-telemetry-blue [color-scheme:dark]"
          >
            {coaches.map((c) => (
              <option key={c.user.id} value={c.user.id}>{c.user.name} ({c.user.email})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs font-medium rounded-lg text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting} className="px-4 py-2 text-xs font-semibold rounded-lg bg-telemetry-blue hover:bg-telemetry-blue/80 text-white shadow-sm transition-colors disabled:opacity-50">
            {submitting ? 'Salvando...' : 'Confirmar Indicação'}
          </button>
        </div>
      </div>
    </div>
  );
}
