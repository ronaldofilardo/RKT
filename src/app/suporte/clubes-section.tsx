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
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-telemetry-text-primary">Gestão de Clubes e CTs</h2>
          <p className="text-xs text-telemetry-text-muted">Aprovação, bloqueio e edição cadastral de clubes</p>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => onFilterChange(s.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
              filter === s.key ? 'border-telemetry-blue text-telemetry-blue bg-telemetry-blue/10 font-semibold' : 'border-telemetry-border/20 text-telemetry-text-muted hover:bg-telemetry-elevated/30'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/20 text-sm font-medium text-telemetry-text-muted">
              <th className="pb-3">Clube / CT</th>
              <th className="pb-3">CNPJ</th>
              <th className="pb-3">Razão Social</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ct) => (
              <tr key={ct.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30">
                <td className="py-3 text-sm text-telemetry-text-primary font-medium">{ct.name}</td>
                <td className="py-3 text-sm text-telemetry-text-muted font-mono text-xs">{ct.cnpj || '-'}</td>
                <td className="py-3 text-sm text-telemetry-text-muted">{ct.legalName || '-'}</td>
                <td className="py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    ct.status === 'ACTIVE' ? 'bg-telemetry-volt/20 text-telemetry-volt' :
                    ct.status === 'PENDING' ? 'bg-telemetry-alert/20 text-telemetry-alert' :
                    'bg-telemetry-error/20 text-telemetry-error'
                  }`}>
                    {ct.status === 'ACTIVE' ? 'Ativo' : ct.status === 'PENDING' ? 'Pendente' : 'Bloqueado'}
                  </span>
                </td>
                <td className="py-3 text-sm text-right whitespace-nowrap">
                  {ct.status === 'PENDING' && <button onClick={() => onApprove(ct.id)} className="text-xs text-telemetry-blue hover:underline mr-3 font-semibold">Aprovar</button>}
                  {ct.status === 'ACTIVE' && <button onClick={() => onSuspend(ct.id)} className="text-xs text-telemetry-error hover:underline mr-3 font-medium">Bloquear</button>}
                  {ct.status === 'SUSPENDED' && <button onClick={() => onReactivate ? onReactivate(ct.id) : onApprove(ct.id)} className="text-xs text-telemetry-volt hover:underline mr-3 font-semibold">Desbloquear</button>}
                  <button onClick={() => onEditClub(ct)} className="text-xs text-telemetry-blue hover:underline font-medium">Editar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-telemetry-text-muted text-sm">Nenhum clube encontrado nesta categoria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
