'use client';

import type { WhereWinner } from './usePointAnnotationFlow';

interface WhereWinnerModalProps {
  isOpen: boolean;
  onSelect: (option: WhereWinner) => void;
  onBack: () => void;
}

const OPTIONS: Array<{ value: WhereWinner; label: string; description: string }> = [
  { value: 'devolvendo', label: 'Devolvendo', description: 'Ponto decidido na devolução do saque' },
  { value: 'fundo', label: 'Fundo de Quadra', description: 'Trocação a partir do fundo' },
  { value: 'voleio', label: 'Na Rede', description: 'Aproximação e voleio' },
  { value: 'passando', label: 'Passando', description: 'Bola de passagem contra quem subiu' },
];

export function WhereWinnerModal({ isOpen, onSelect, onBack }: WhereWinnerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Onde estava o vencedor"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-telemetry-card p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold tracking-tight">Onde estava o vencedor?</h2>
        <p className="mt-1 mb-5 text-sm text-telemetry-text-muted">
          Posição do jogador que ganhou o ponto
        </p>

        <div className="space-y-2">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-white/20 hover:bg-white/10 active:scale-[0.99]"
            >
              <span className="block font-medium">{option.label}</span>
              <span className="block text-sm text-telemetry-text-muted">{option.description}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition-colors hover:bg-white/10 active:scale-[0.99]"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
