'use client';

import { maskCpf } from '@/lib/validators/masks';
import type { MembroFormData } from './cadastrar-membro-form';

interface CadastrarMenorResponsavelFieldsProps {
  formData: MembroFormData;
  setFormData: React.Dispatch<React.SetStateAction<MembroFormData>>;
  fieldError: string | null;
}

export function CadastrarMenorResponsavelFields({
  formData,
  setFormData,
  fieldError,
}: CadastrarMenorResponsavelFieldsProps) {
  const handleChange = (key: keyof MembroFormData, value: string) =>
    setFormData((p) => ({ ...p, [key]: value }));

  return (
    <div className="bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-telemetry-blue uppercase tracking-wide">
          Responsável Legal (Atleta Menor de Idade)
        </span>
      </div>
      <p className="text-[11px] text-telemetry-text-muted">
        O cadastro de menores exige os dados do responsável que autorizou a inscrição no clube.
      </p>

      <div>
        <label htmlFor="responsavel-nome" className="text-xs font-medium text-telemetry-text-muted block mb-1">
          Nome do Responsável *
        </label>
        <input
          id="responsavel-nome"
          type="text"
          required
          placeholder="Nome completo do pai, mãe ou tutor"
          value={formData.guardianName || ''}
          onChange={(e) => handleChange('guardianName', e.target.value)}
          className={`w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2 text-xs focus:border-telemetry-blue focus:outline-none ${
            fieldError === 'guardianName' ? 'border-telemetry-error' : ''
          }`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="responsavel-cpf" className="text-xs font-medium text-telemetry-text-muted block mb-1">
            CPF do Responsável *
          </label>
          <input
            id="responsavel-cpf"
            type="text"
            required
            placeholder="000.000.000-00"
            value={formData.guardianCpf || ''}
            onChange={(e) => handleChange('guardianCpf', maskCpf(e.target.value))}
            className={`w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2 text-xs focus:border-telemetry-blue focus:outline-none ${
              fieldError === 'guardianCpf' ? 'border-telemetry-error' : ''
            }`}
          />
        </div>
        <div>
          <label htmlFor="responsavel-telefone" className="text-xs font-medium text-telemetry-text-muted block mb-1">
            Telefone / WhatsApp
          </label>
          <input
            id="responsavel-telefone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={formData.guardianPhone || ''}
            onChange={(e) => handleChange('guardianPhone', e.target.value)}
            className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2 text-xs focus:border-telemetry-blue focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
