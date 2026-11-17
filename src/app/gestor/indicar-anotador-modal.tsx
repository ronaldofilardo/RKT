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

export function IndicarAnotadorModal({
  open,
  onOpenChange,
  match,
  coaches,
  onSuccess,
}: IndicarAnotadorModalProps) {
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      const existing =
        match.assignedCoaches && match.assignedCoaches.length > 0
          ? match.assignedCoaches.map((ac) => ac.coach.id).filter(Boolean)
          : match.assignedCoachId
          ? [match.assignedCoachId]
          : coaches[0]?.user.id
          ? [coaches[0].user.id]
          : [];
      setSelectedCoachIds(existing);
      setError(null);
    }
  }, [match, coaches]);

  if (!open || !match) return null;

  function toggleCoach(coachId: string) {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId],
    );
  }

  async function handleConfirm() {
    if (selectedCoachIds.length === 0) {
      setError('Selecione ao menos um treinador ou anotador.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload =
        selectedCoachIds.length === 1
          ? { coachUserId: selectedCoachIds[0] }
          : { coachUserId: selectedCoachIds[0], coachUserIds: selectedCoachIds };

      const res = await fetch(`/api/gestor/matches/${match!.id}/assign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
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

  const isDoubles = match.matchType === 'DOUBLES' || Boolean(match.player1Partner || match.player2Partner);
  const p1Side = match.player1Partner
    ? `${match.player1?.name || 'Jogador 1'} / ${match.player1Partner.name}`
    : (match.player1?.name || 'Jogador 1');
  const p2Side = match.player2Partner
    ? `${match.player2?.name || 'Jogador 2'} / ${match.player2Partner.name}`
    : (match.player2?.name || 'Jogador 2');
  const matchTitle = `${isDoubles ? '[Duplas] ' : ''}${p1Side} × ${p2Side}`;

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

        {/* Informação sobre independência soberana das anotações */}
        <div className="p-3 rounded-lg bg-telemetry-elevated/80 border border-white/5 space-y-1 text-xs">
          <div className="font-semibold text-telemetry-blue-light flex items-center gap-1.5">
            <span aria-hidden="true">ℹ️</span>
            <span>Anotações e Timelines Independentes</span>
          </div>
          <p className="text-telemetry-text-muted leading-relaxed">
            Cada anotador indicado terá sua própria timeline e contagem soberana da partida. As marcações não se misturam, permitindo que múltiplos anotadores registrem o jogo em paralelo ou iniciem em momentos distintos.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-telemetry-text-muted block">
              Membros anotadores ou treinadores ({selectedCoachIds.length} selecionado(s))
            </label>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 rounded-lg border border-white/10 bg-telemetry-elevated/40">
            {coaches.length === 0 ? (
              <p className="text-xs text-telemetry-text-muted p-3 text-center">Nenhum treinador cadastrado no clube.</p>
            ) : (
              coaches.map((c) => {
                const isChecked = selectedCoachIds.includes(c.user.id);
                return (
                  <label
                    key={c.user.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-sm border ${
                      isChecked
                        ? 'bg-telemetry-blue/15 border-telemetry-blue-light/30 text-telemetry-text-primary'
                        : 'border-transparent hover:bg-white/5 text-telemetry-text-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCoach(c.user.id)}
                      className="w-4 h-4 rounded border-white/20 bg-telemetry-card text-telemetry-blue focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-telemetry-text-primary block truncate">
                        {c.user.name} ({c.user.email})
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-medium rounded-lg text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-telemetry-blue hover:bg-telemetry-blue/80 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Confirmar Indicação'}
          </button>
        </div>
      </div>
    </div>
  );
}
