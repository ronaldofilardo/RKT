'use client';

import React from 'react';
import type { AthleteForm } from '../types';
import { maskCpf } from '@/lib/validators/masks';

interface EditAthleteGuardianFieldsProps {
  form: AthleteForm;
  setForm: React.Dispatch<React.SetStateAction<AthleteForm>>;
  saving: boolean;
  immutable?: boolean;
}

export function EditAthleteGuardianFields({
  form, setForm, saving, immutable = false,
}: EditAthleteGuardianFieldsProps) {
  const isLocked = saving || immutable;

  return (
    <div className="bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-telemetry-blue uppercase tracking-wide">
          Responsável Legal (Atleta Menor de Idade)
        </span>
        {immutable && (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            🔒 Consentimento Confirmado (Imutável)
          </span>
        )}
      </div>

      {immutable ? (
        <p className="text-[11px] text-emerald-400/90 font-medium bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2">
          Consentimento certificado sob ECA Digital e LGPD. Os dados do responsável legal não podem ser alterados pelo clube.
        </p>
      ) : (
        <p className="text-[11px] text-telemetry-text-muted">
          O cadastro de menores exige os dados do responsável que autorizou a inscrição.
        </p>
      )}

      <div>
        <label htmlFor="edit-guardian-name" className="block text-xs font-medium text-telemetry-text-primary mb-1">
          Nome do Responsável {!immutable && <span className="text-red-500">*</span>}
        </label>
        <input
          id="edit-guardian-name" type="text" required={!immutable} value={form.guardianName || ''}
          onChange={(e) => setForm((p) => ({ ...p, guardianName: e.target.value }))} disabled={isLocked}
          placeholder="Nome completo do pai, mãe ou tutor"
          className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm disabled:opacity-75 disabled:cursor-not-allowed"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-guardian-cpf" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            CPF do Responsável {!immutable && <span className="text-red-500">*</span>}
          </label>
          <input
            id="edit-guardian-cpf" type="text" required={!immutable} value={form.guardianCpf || ''}
            onChange={(e) => setForm((p) => ({ ...p, guardianCpf: maskCpf(e.target.value) }))} disabled={isLocked}
            placeholder="000.000.000-00"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label htmlFor="edit-guardian-phone" className="block text-xs font-medium text-telemetry-text-primary mb-1">
            Telefone do Responsável
          </label>
          <input
            id="edit-guardian-phone" type="tel" value={form.guardianPhone || ''}
            onChange={(e) => setForm((p) => ({ ...p, guardianPhone: e.target.value }))} disabled={isLocked}
            placeholder="(00) 00000-0000"
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-guardian-contact" className="block text-xs font-medium text-telemetry-text-primary mb-1">
          Grau de Parentesco / Contato Adicional
        </label>
        <input
          id="edit-guardian-contact" type="text" value={form.guardianContact || ''}
          onChange={(e) => setForm((p) => ({ ...p, guardianContact: e.target.value }))} disabled={isLocked}
          placeholder="Ex: Mãe, Pai, Tutor legal"
          className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-sm disabled:opacity-75 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
