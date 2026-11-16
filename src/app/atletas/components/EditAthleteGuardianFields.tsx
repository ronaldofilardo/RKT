'use client';

import React from 'react';
import type { AthleteForm } from '../types';
import { maskCpf } from '@/lib/validators/masks';

interface EditAthleteGuardianFieldsProps {
  form: AthleteForm;
  setForm: React.Dispatch<React.SetStateAction<AthleteForm>>;
  saving: boolean;
}

export function EditAthleteGuardianFields({
  form, setForm, saving,
}: EditAthleteGuardianFieldsProps) {
  return (
    <div className="bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-telemetry-blue uppercase tracking-wide">
          Responsável Legal (Atleta Menor de Idade)
        </span>
      </div>
      <p className="text-[11px] text-telemetry-text-muted">
        O cadastro de menores exige os dados do responsável que autorizou a inscrição.
      </p>

      <div>
        <label htmlFor="edit-guardian-name" className="block text-xs font-medium text-telemetry-text-primary mb-1">
          Nome do Responsável <span className="text-red-500">*</span>
        </label>
        <input
          id="edit-guardian-name"
          type="text"
          required
          value={form.guardianName || ''}
          onChange={(e) => setForm((p) => ({ ...p, guardianName: e.target.value }))}
          disabled={saving}
          placeholder="Nome completo do pai, mãe ou tutor"
          className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-guardian-cpf" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            CPF do Responsável <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-guardian-cpf"
            type="text"
            required
            value={form.guardianCpf || ''}
            onChange={(e) => setForm((p) => ({ ...p, guardianCpf: maskCpf(e.target.value) }))}
            disabled={saving}
            placeholder="000.000.000-00"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm"
          />
        </div>
        <div>
          <label htmlFor="edit-guardian-phone" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            Telefone do Responsável
          </label>
          <input
            id="edit-guardian-phone"
            type="tel"
            value={form.guardianPhone || ''}
            onChange={(e) => setForm((p) => ({ ...p, guardianPhone: e.target.value }))}
            disabled={saving}
            placeholder="(00) 00000-0000"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-guardian-contact" className="block text-xs font-medium text-telemetry-text-primary mb-1">
          Grau de Parentesco / Contato Adicional
        </label>
        <input
          id="edit-guardian-contact"
          type="text"
          value={form.guardianContact || ''}
          onChange={(e) => setForm((p) => ({ ...p, guardianContact: e.target.value }))}
          disabled={saving}
          placeholder="Ex: Mãe, Pai, Tutor legal"
          className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt focus:border-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm"
        />
      </div>
    </div>
  );
}
