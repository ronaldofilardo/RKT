'use client';

import type { SlotAffiliation } from '../slot-affiliation';

interface SlotAffiliationToggleProps {
  value: SlotAffiliation;
  onChange: (v: SlotAffiliation) => void;
  /** Sem clube selecionado (ctId ausente) o controle é ocultado — tudo vira "Outro clube". */
  disabled?: boolean;
  isParticular?: boolean;
}

export function SlotAffiliationToggle({ value, onChange, disabled = false, isParticular = false }: SlotAffiliationToggleProps) {
  if (disabled) return null;
  const base = 'flex-1 py-1 text-xs font-medium transition-colors';
  const on = 'bg-telemetry-blue text-white';
  const off = 'text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/5';
  const ownLabel = isParticular ? 'Meu atleta' : 'Meu clube';
  const otherLabel = 'Outros';
  return (
    <div
      className="mt-1.5 flex rounded-md border border-white/10 overflow-hidden"
      role="group"
      aria-label="Clube do atleta"
    >
      <button
        type="button"
        onClick={() => onChange('OWN')}
        aria-pressed={value === 'OWN'}
        className={`${base} ${value === 'OWN' ? on : off}`}
      >
        {ownLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('NOT_OWN')}
        aria-pressed={value === 'NOT_OWN'}
        className={`${base} ${value === 'NOT_OWN' ? 'bg-telemetry-elevated text-telemetry-text-primary' : off}`}
      >
        {otherLabel}
      </button>
    </div>
  );
}
