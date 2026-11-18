'use client';

import type { ClubMatchItem, CoachItem } from './types';
import { IndicarAnotadorCoachList } from './indicar-anotador-coach-list';
import { useIndicarAnotador } from './use-indicar-anotador';

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
  const { selectedCoachIds, submitting, error, toggleCoach, handleConfirm } =
    useIndicarAnotador(match, coaches, onOpenChange, onSuccess);

  if (!open || !match) return null;

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

        <div className="p-3 rounded-lg bg-telemetry-elevated/80 border border-white/5 space-y-1 text-xs">
          <div className="font-semibold text-telemetry-blue-light flex items-center gap-1.5">
            <span aria-hidden="true">ℹ️</span>
            <span>Anotações e Timelines Independentes</span>
          </div>
          <p className="text-telemetry-text-muted leading-relaxed">
            Cada anotador indicado terá sua própria timeline e contagem soberana da partida. As marcações não se misturam, permitindo que múltiplos anotadores registrem o jogo em paralelo ou iniciem em momentos distintos.
          </p>
        </div>

        <IndicarAnotadorCoachList
          coaches={coaches}
          selectedCoachIds={selectedCoachIds}
          onToggleCoach={toggleCoach}
        />

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
