'use client';

import { ServeActionButtons } from './ServeActionButtons';
import { ServeInlinePanel } from './ServeInlinePanel';
import type { ServeInlineControlsProps } from './serve-inline.types';

/** Ace/Out/Net + painel de detalhes expansível, sempre na coluna do sacador. */
export function ServeInlineControls({
  step, disabled, processing, openAction, onAction, onConfirm, onCancel,
}: ServeInlineControlsProps) {
  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      {step === 'second' && (
        <div
          data-testid="serve-inline-second-badge"
          role="status"
          aria-label="2º Saque em andamento"
          className="flex items-center gap-2 my-0.5"
        >
          <div className="flex-1 h-px bg-telemetry-alert/40" />
          <span className="flex-shrink-0 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-telemetry-alert text-telemetry-base shadow-sm">
            2º Saque
          </span>
          <div className="flex-1 h-px bg-telemetry-alert/40" />
        </div>
      )}
      <ServeActionButtons step={step} disabled={disabled} processing={processing} openAction={openAction} onAction={onAction} />
      {openAction && (
        <ServeInlinePanel
          key={`${openAction}-${step}`}
          action={openAction}
          step={step}
          disabled={disabled}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
