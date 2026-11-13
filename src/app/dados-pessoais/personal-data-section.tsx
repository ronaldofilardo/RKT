'use client';

import { useState, useEffect } from 'react';
import { formatBirthDate } from '@/lib/athlete-labels.logic';
import { formatCpf } from '@/lib/validators/cpf.validator';

interface PersonalDataSectionProps {
  name: string;
  cpf: string;
  birthDate: string | null;
  minor?: boolean;
  saving?: boolean;
  onSaveName?: (name: string) => void;
}

const isPlaceholderCpf = (cpf: string) => cpf.startsWith('PLACEHOLDER_');

export function PersonalDataSection({
  name, cpf, birthDate, minor = false, saving = false, onSaveName,
}: PersonalDataSectionProps) {
  const [editingName, setEditingName] = useState(name);
  const cpfLabel = cpf && !isPlaceholderCpf(cpf) ? formatCpf(cpf) : '—';
  const birthDateLabel = formatBirthDate(birthDate) ?? '—';

  useEffect(() => { setEditingName(name); }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim().length >= 2) onSaveName?.(editingName.trim());
  };

  return (
    <section className="rounded-xl border border-white/10 bg-telemetry-card p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-telemetry-text-primary">Dados Pessoais</h2>
        <p className="text-xs text-telemetry-text-muted">
          {minor
            ? 'Atletas menores de 18 anos não podem alterar dados cadastrais diretamente.'
            : 'Usuários maiores de 18 anos podem alterar seus dados cadastrais (CPF não editável).'}
        </p>
      </div>

      {minor ? (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><dt className="text-xs font-medium text-telemetry-text-muted uppercase tracking-wider">Nome</dt><dd className="mt-1 text-telemetry-text-primary font-medium">{name || '—'}</dd></div>
          <div><dt className="text-xs font-medium text-telemetry-text-muted uppercase tracking-wider">CPF</dt><dd className="mt-1 text-telemetry-text-primary font-mono">{cpfLabel}</dd></div>
          <div><dt className="text-xs font-medium text-telemetry-text-muted uppercase tracking-wider">Data de nascimento</dt><dd className="mt-1 text-telemetry-text-primary">{birthDateLabel}</dd></div>
        </dl>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="user-name" className="block text-xs font-medium text-telemetry-text-muted uppercase tracking-wider mb-1">Nome</label>
              <input id="user-name" type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} disabled={saving} minLength={2} maxLength={120} className="w-full rounded-lg border border-white/10 bg-telemetry-elevated px-3 py-1.5 text-sm text-telemetry-text-primary focus:border-telemetry-volt focus:outline-none" />
            </div>
            <div>
              <label htmlFor="user-cpf" className="block text-xs font-medium text-telemetry-text-muted uppercase tracking-wider mb-1">CPF (não editável)</label>
              <input id="user-cpf" type="text" value={cpfLabel} disabled className="w-full rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-sm text-telemetry-text-muted font-mono cursor-not-allowed" />
            </div>
            <div>
              <span className="block text-xs font-medium text-telemetry-text-muted uppercase tracking-wider mb-1">Data de nascimento</span>
              <p className="mt-2 text-telemetry-text-primary">{birthDateLabel}</p>
            </div>
          </div>
          {onSaveName && (
            <div className="flex justify-end">
              <button type="submit" disabled={saving || editingName.trim() === name || editingName.trim().length < 2} className="rounded-lg bg-telemetry-blue hover:bg-telemetry-blue/80 px-4 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
