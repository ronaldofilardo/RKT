'use client';

import type { StaffIndicationInput } from '@/schemas/guardian';

interface ResponsavelStaffKindProps {
  kind: StaffIndicationInput['kind'];
  onChange: (kind: StaffIndicationInput['kind']) => void;
}

const KIND_OPTIONS: { value: StaffIndicationInput['kind']; label: string }[] = [
  { value: 'CT', label: 'Clube / CT cadastrado' },
  { value: 'COACH', label: 'Treinador Particular cadastrado' },
  { value: 'EXTERNAL_COACH', label: 'Convidar novo Treinador via WhatsApp' },
];

/** Seletor do tipo de indicação: pool CT, pool treinador ou convite externo. */
export function ResponsavelStaffKind({ kind, onChange }: ResponsavelStaffKindProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de indicação">
      {KIND_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={kind === opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
            kind === opt.value
              ? 'border-telemetry-blue bg-telemetry-blue/15 text-telemetry-text-primary ring-1 ring-telemetry-blue'
              : 'border-telemetry-border/30 bg-telemetry-elevated/40 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-telemetry-elevated/70'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
