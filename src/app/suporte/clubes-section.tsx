'use client';

import type { TrainingCenter, CtStatusFilter } from './types';

interface ClubesSectionProps {
  clubs: TrainingCenter[];
  filter: CtStatusFilter;
  onFilterChange: (filter: CtStatusFilter) => void;
  onApprove: (ctId: string) => void;
  onSuspend: (ctId: string) => void;
  onReactivate?: (ctId: string) => void;
  onEditClub: (ct: TrainingCenter) => void;
}

export function ClubesSection({
  clubs, filter, onFilterChange, onApprove, onSuspend, onReactivate, onEditClub,
}: ClubesSectionProps) {
  const filtered = clubs.filter((c) => filter === 'ALL' || c.status === filter);

  const statuses: Array<{ key: CtStatusFilter; label: string }> = [
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'ACTIVE', label: 'Ativos' },
    { key: 'SUSPENDED', label: 'Bloqueados' },
    { key: 'ALL', label: 'Todos' },
  ];

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-telemetry-text-primary">Gestão de Clubes e CTs</h2>
          <p className="text-xs text-telemetry-text-muted">Aprovação, bloqueio e edição cadastral de clubes</p>
        </div>
      </div>
      <div className="flex gap-2">
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => onFilterChange(s.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filter === s.key
                ? 'border-telemetry-blue text-telemetry-blue bg-telemetry-blue/10 font-semibold'
                : 'border-telemetry-border text-telemetry-text-muted hover:bg-telemetry-elevated hover:text-telemetry-text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/40">
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Clube / CT</th>
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">CNPJ</th>
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Razão Social</th>
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Status</th>
              <th className="px-3 pb-4 pt-4 text-right text-sm font-medium text-telemetry-text-primary">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ct) => (
              <tr key={ct.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
                <td className="px-3 py-3 text-sm text-telemetry-text-primary font-medium">{ct.name}</td>
                <td className="px-3 py-3 text-sm text-telemetry-text-muted font-mono text-xs">{ct.cnpj || '-'}</td>
                <td className="px-3 py-3 text-sm text-telemetry-text-muted">{ct.legalName || '-'}</td>
                <td className="px-3 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    ct.status === 'ACTIVE' ? 'bg-telemetry-volt/20 text-telemetry-volt' :
                    ct.status === 'PENDING' ? 'bg-telemetry-alert/20 text-telemetry-alert' :
                    'bg-telemetry-error/20 text-telemetry-error'
                  }`}>
                    {ct.status === 'ACTIVE' ? 'Ativo' : ct.status === 'PENDING' ? 'Pendente' : 'Bloqueado'}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                  {ct.status === 'PENDING' && <button onClick={() => onApprove(ct.id)} className="text-xs text-telemetry-blue hover:underline mr-3 font-semibold">Aprovar</button>}
                  {ct.status === 'ACTIVE' && <button onClick={() => onSuspend(ct.id)} className="text-xs text-telemetry-error hover:underline mr-3 font-medium">Bloquear</button>}
                  {ct.status === 'SUSPENDED' && <button onClick={() => onReactivate ? onReactivate(ct.id) : onApprove(ct.id)} className="text-xs text-telemetry-volt hover:underline mr-3 font-semibold">Desbloquear</button>}
                  <button onClick={() => onEditClub(ct)} className="text-xs text-telemetry-blue hover:underline font-medium">Editar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-telemetry-text-muted text-sm">Nenhum clube encontrado nesta categoria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
