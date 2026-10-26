'use client';

import { useState } from 'react';
import { PillGroup, Section, EFFECT_OPTIONS, DIRECTION_OPTIONS } from './server-effect-modal-controls';
import type { ServeAction, ServeStepName } from './serve-inline.types';

interface ServeInlinePanelProps {
  action: ServeAction;
  step: ServeStepName;
  disabled: boolean;
  onConfirm: (effect?: string, direction?: string) => void;
  onCancel: () => void;
}

function confirmLabel(action: ServeAction, step: ServeStepName): string {
  if (action === 'ace') return 'Confirmar Ponto';
  return step === 'first' ? 'Registrar e Continuar' : 'Registrar Dupla Falta';
}

const actionBtn = 'rounded-xl font-bold text-[clamp(11px,1.7dvh,14px)] leading-tight px-1 min-h-[clamp(34px,5.4dvh,48px)] transition-all disabled:opacity-40';

/** Substitui o antigo ServerEffectModal: expande no lugar, dentro da coluna do sacador. */
export function ServeInlinePanel({ action, step, disabled, onConfirm, onCancel }: ServeInlinePanelProps) {
  const [effect, setEffect] = useState<string | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const isFault = action !== 'ace';
  const accent = isFault ? 'rgb(var(--telemetry-error))' : 'rgb(var(--telemetry-volt))';
  const suffix = isFault ? ' da Falha (opcional)' : '';
  return (
    <div
      role="group"
      aria-label={isFault ? 'Detalhes do erro de saque' : 'Detalhes do ace'}
      className="flex-shrink-0 flex flex-col gap-[clamp(4px,1dvh,10px)] p-[clamp(6px,1.2dvh,12px)] rounded-xl bg-telemetry-card border border-white/10 border-t-4 animate-[fadeInSlideUp_0.2s_ease-out]"
      style={{ borderTopColor: accent }}
    >
      <Section label={`Efeito${suffix}`}>
        <PillGroup options={EFFECT_OPTIONS} selected={effect} onChange={setEffect} />
      </Section>
      <Section label={isFault ? 'Direção da Falha (opcional)' : 'Direção'}>
        <PillGroup options={DIRECTION_OPTIONS} selected={direction} onChange={setDirection} />
      </Section>
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" disabled={disabled} onClick={() => onConfirm(effect ?? undefined, direction ?? undefined)}
          className={`${actionBtn} bg-telemetry-blue hover:bg-telemetry-active text-white border border-white/10`}>
          {confirmLabel(action, step)}
        </button>
        <button type="button" onClick={onCancel}
          className={`${actionBtn} bg-transparent text-telemetry-alert border border-telemetry-alert/60 hover:bg-telemetry-alert/10`}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
