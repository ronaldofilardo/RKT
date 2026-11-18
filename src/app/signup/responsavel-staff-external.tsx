'use client';

import { useState } from 'react';
import type { StaffIndicationInput } from '@/schemas/guardian';

interface ResponsavelStaffExternalProps {
  indication: StaffIndicationInput;
  onChange: (indication: StaffIndicationInput) => void;
}

/** Formulário do treinador externo: nome + WhatsApp (dígitos, máx. 13). */
export function ResponsavelStaffExternal({ indication, onChange }: ResponsavelStaffExternalProps) {
  const [phone, setPhone] = useState(indication.coachPhone ?? '');

  const handlePhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    setPhone(digits);
    onChange({ kind: 'EXTERNAL_COACH', coachName: indication.coachName, coachPhone: digits });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div>
        <label htmlFor="responsavel-staff-name" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
          Nome do treinador
        </label>
        <input
          id="responsavel-staff-name"
          type="text"
          value={indication.coachName ?? ''}
          onChange={(e) =>
            onChange({ kind: 'EXTERNAL_COACH', coachName: e.target.value, coachPhone: indication.coachPhone })
          }
          placeholder="Nome completo"
          className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-blue"
        />
      </div>
      <div>
        <label htmlFor="responsavel-staff-phone" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
          WhatsApp do treinador
        </label>
        <input
          id="responsavel-staff-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => handlePhone(e.target.value)}
          placeholder="5511999999999"
          className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-blue"
        />
      </div>
    </div>
  );
}
