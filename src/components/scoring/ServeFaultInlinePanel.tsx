'use client';

import { useState } from 'react';
import { ServeInlinePanel } from './ServeInlinePanel';

interface ServeFaultInlinePanelProps {
  hasFirstServeError: boolean;
  disabled?: boolean;
  /** Fase 1: usuário escolhe Out/Net. */
  onSelectError: (errorType: 'out' | 'net') => void;
  /** Fase 2: confirma com efeito/direção (ou direto, sem). */
  onConfirm: (effect?: string, direction?: string) => void;
  onBack: () => void;
}

/** Escolha Out/Net e, abaixo, o painel de efeito/direção (opcionais) da falha. */
export function ServeFaultInlinePanel({
  hasFirstServeError,
  disabled = false,
  onSelectError,
  onConfirm,
  onBack,
}: ServeFaultInlinePanelProps) {
  const [errorType, setErrorType] = useState<'out' | 'net' | null>(null);

  const handleErrorSelect = (error: 'out' | 'net') => {
    setErrorType(error);
    onSelectError(error);
  };

  return (
    <section
      aria-label={hasFirstServeError ? 'Dupla falta' : 'Erro de primeiro saque'}
      className="rounded-xl bg-telemetry-card border border-white/10 px-3 py-2 flex flex-col gap-2"
    >
      <h2 className="text-center text-[clamp(12px,1.7dvh,15px)] font-semibold tracking-tight">
        {hasFirstServeError ? 'DUPLA FALTA' : 'Falta no 1º saque'}
      </h2>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={disabled}
          aria-pressed={errorType === 'out'}
          onClick={() => handleErrorSelect('out')}
          className={`rounded-lg border py-2 text-[clamp(11px,1.6dvh,14px)] font-bold transition-all disabled:opacity-40 ${
            errorType === 'out'
              ? 'border-telemetry-alert bg-telemetry-alert/20 text-telemetry-alert'
              : 'border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98]'
          }`}
        >
          ✕ Out
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={errorType === 'net'}
          onClick={() => handleErrorSelect('net')}
          className={`rounded-lg border py-2 text-[clamp(11px,1.6dvh,14px)] font-bold transition-all disabled:opacity-40 ${
            errorType === 'net'
              ? 'border-telemetry-alert bg-telemetry-alert/20 text-telemetry-alert'
              : 'border-white/10 bg-white/5 hover:bg-white/10 active:scale-[0.98]'
          }`}
        >
          # Net
        </button>
      </div>

      {errorType && (
        <ServeInlinePanel
          action={errorType}
          step={hasFirstServeError ? 'second' : 'first'}
          disabled={disabled}
          onConfirm={onConfirm}
          onCancel={onBack}
        />
      )}

      {!errorType && (
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-lg border border-white/10 bg-transparent py-1 text-[clamp(10px,1.4dvh,12px)] text-telemetry-text-muted transition-colors hover:bg-white/5"
        >
          Voltar
        </button>
      )}
    </section>
  );
}
