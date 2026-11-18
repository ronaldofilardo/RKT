'use client';

import { useState } from 'react';

interface CoachEcaTermsModalProps {
  isOpen: boolean;
  onAccept: () => Promise<boolean>;
  submitting: boolean;
}

export function CoachEcaTermsModal({ isOpen, onAccept, submitting }: CoachEcaTermsModalProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-bold flex-shrink-0">
            ⚖️
          </div>
          <div>
            <h2 className="text-lg font-bold text-telemetry-text-primary">ECA Digital & Treinador Particular</h2>
            <p className="text-xs text-telemetry-text-muted">Lei nº 15.211/2025 e LGPD Art. 14</p>
          </div>
        </div>

        <div className="p-3.5 bg-telemetry-elevated rounded-xl border border-white/5 space-y-2 text-xs text-telemetry-text-secondary leading-relaxed">
          <p>
            <strong className="text-telemetry-text-primary">Atenção profissional:</strong> Por força do ECA Digital (Lei nº 15.211/2025), treinadores particulares como pessoas físicas estão <strong>expressamente proibidos de cadastrar atletas menores de 18 anos</strong> diretamente na plataforma.
          </p>
          <p>
            Todo atleta menor deve ser cadastrado obrigatoriamente por seu <strong>Responsável Legal</strong>, que realizará a indicação do treinador dentro do aplicativo mediante consentimento formal da Tríade Parental.
          </p>
          <p className="text-amber-400/90 font-medium">
            O descumprimento ou tentativa de burla acarretará o cancelamento imediato do cadastro e responsabilização civil e criminal.
          </p>
        </div>

        <label className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 rounded border-white/20 bg-telemetry-elevated text-telemetry-blue focus:ring-telemetry-blue"
          />
          <span className="text-xs text-telemetry-text-primary">
            Declaro que li e compreendi as diretrizes do ECA Digital e estou ciente das penalidades legais pelo descumprimento.
          </span>
        </label>

        <button
          type="button"
          onClick={onAccept}
          disabled={!agreed || submitting}
          className="w-full py-2.5 px-4 bg-telemetry-blue text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm"
        >
          {submitting ? 'Registrando aceite...' : 'Confirmar e Acessar Plataforma'}
        </button>
      </div>
    </div>
  );
}
