'use client';

import type { ResponsavelMinorForm, ResponsavelRelationship } from './responsavel-onboarding-logic';

interface ResponsavelMinorFieldsProps {
  minor: ResponsavelMinorForm;
  onFieldChange: <K extends keyof ResponsavelMinorForm>(key: K, value: ResponsavelMinorForm[K]) => void;
}

const RELATIONSHIPS: { value: ResponsavelRelationship; label: string }[] = [
  { value: 'PAI', label: 'Pai' },
  { value: 'MAE', label: 'Mãe' },
  { value: 'TUTOR_LEGAL', label: 'Tutor(a) legal' },
];

/** Campos de identificação do menor: nome, nascimento, CPF e parentesco. */
export function ResponsavelMinorFields({ minor, onFieldChange }: ResponsavelMinorFieldsProps) {
  const nameInvalid = minor.minorName.length > 0 && minor.minorName.trim().length < 3;

  return (
    <>
      <div>
        <label htmlFor="responsavel-minor-name" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
          Nome do menor
        </label>
        <input
          id="responsavel-minor-name"
          type="text"
          value={minor.minorName}
          onChange={(e) => onFieldChange('minorName', e.target.value)}
          aria-invalid={nameInvalid}
          placeholder="Nome completo do atleta"
          className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-blue"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label htmlFor="responsavel-minor-birthdate" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
            Data de nascimento
          </label>
          <input
            id="responsavel-minor-birthdate"
            type="date"
            value={minor.minorBirthDate}
            onChange={(e) => onFieldChange('minorBirthDate', e.target.value)}
            className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-blue"
          />
        </div>
        <div>
          <label htmlFor="responsavel-minor-cpf" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
            CPF do menor (opcional)
          </label>
          <input
            id="responsavel-minor-cpf"
            type="text"
            inputMode="numeric"
            value={minor.minorCpf}
            onChange={(e) => onFieldChange('minorCpf', e.target.value)}
            placeholder="Somente dígitos"
            className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-blue"
          />
        </div>
      </div>

      <div>
        <label htmlFor="responsavel-minor-relationship" className="text-[11px] font-medium text-telemetry-text-muted block mb-1">
          Grau de parentesco
        </label>
        <select
          id="responsavel-minor-relationship"
          value={minor.relationship}
          onChange={(e) => onFieldChange('relationship', e.target.value as ResponsavelRelationship)}
          className="w-full bg-telemetry-base border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-blue"
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value} className="bg-telemetry-card text-telemetry-text-primary">
              {r.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
