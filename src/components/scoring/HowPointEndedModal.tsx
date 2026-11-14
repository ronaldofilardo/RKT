'use client';

import type { HowPointEnded } from './usePointAnnotationFlow';

interface HowPointEndedModalProps {
  isOpen: boolean;
  onSelect: (option: HowPointEnded) => void;
  onAce: (withDetails: boolean) => void;
  firstServeErrorRegistered: boolean;
}

interface EndedOption {
  value: HowPointEnded;
  label: string;
  description: string;
}

const OPTIONS: EndedOption[] = [
  { value: 'ACE', label: 'Ace', description: 'Saque direto, sem devolução' },
  { value: 'SERVE_FAULT', label: 'Erro de Saque', description: 'Falta ou rede no saque' },
  { value: 'WINNER', label: 'Winner', description: 'Bola vencedora' },
  { value: 'ERRO_FORCADO', label: 'Erro Forçado', description: 'Adversário foi forçado ao erro' },
  { value: 'ERRO_NAO_FORCADO', label: 'Erro Não-Forçado', description: 'Erro sem pressão' },
];

export function HowPointEndedModal({
  isOpen,
  onSelect,
  onAce,
  firstServeErrorRegistered,
}: HowPointEndedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Como terminou o ponto"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-telemetry-card p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold tracking-tight">Como terminou o ponto?</h2>
        <p className="mt-1 mb-5 text-sm text-telemetry-text-muted">
          {firstServeErrorRegistered
            ? 'Primeiro saque já registrado — o próximo erro encerra o ponto'
            : 'Selecione a forma como o ponto foi encerrado'}
        </p>

        <div className="space-y-2">
          {OPTIONS.map((option) => {
            const isServeOption = option.value === 'ACE' || option.value === 'SERVE_FAULT';
            const label =
              option.value === 'SERVE_FAULT' && firstServeErrorRegistered
                ? 'Dupla Falta'
                : option.label;

            return (
              <div key={option.value} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-white/20 hover:bg-white/10 active:scale-[0.99]"
                >
                  <span className="block font-medium">{label}</span>
                  <span className="block text-sm text-telemetry-text-muted">{option.description}</span>
                </button>

                {isServeOption && (
                  <button
                    type="button"
                    onClick={() => onAce(option.value === 'ACE')}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-emerald-400 transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/10 active:scale-[0.98]"
                    aria-label={option.value === 'ACE' ? 'Ace com detalhes' : 'Falta com detalhes'}
                  >
                    Detalhes
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
