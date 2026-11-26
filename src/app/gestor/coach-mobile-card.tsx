'use client';

import type { CoachItem } from './types';
import { LinkIcon } from '@/components/athlete/athlete-row-icons';

interface CoachMobileCardProps {
  coach: CoachItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onGenerateLink: () => void;
  onToggleCanInsertAthletes: (checked: boolean) => void;
  onDelete?: () => void;
}

export function CoachMobileCard({
  coach: c, selected, onSelect, onEdit, onGenerateLink, onToggleCanInsertAthletes, onDelete,
}: CoachMobileCardProps) {
  const formattedCpf = c.user.cpf ? c.user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-';

  return (
    <div className="bg-telemetry-card rounded-xl border border-telemetry-border/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <input
            type="checkbox"
            aria-label={`Selecionar ${c.user.name}`}
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="mt-1 w-4 h-4 text-telemetry-blue border-telemetry-border rounded shrink-0"
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-telemetry-text-primary truncate">{c.user.name}</p>
            <p className="text-xs text-telemetry-text-muted font-sans tabular-nums">{formattedCpf}</p>
            <p className="text-xs text-telemetry-text-muted truncate">{c.user.email}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${c.user.mustChangePassword ? 'bg-telemetry-alert/20 text-telemetry-alert' : 'bg-telemetry-volt/20 text-telemetry-volt'}`}>
          {c.user.mustChangePassword ? 'Senha pendente' : 'Ativo'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-telemetry-border/10">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-telemetry-text-primary">
          <input
            type="checkbox"
            checked={c.canInsertAthletes}
            onChange={(e) => onToggleCanInsertAthletes(e.target.checked)}
            className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
            aria-label={`Permitir cadastro de atletas para ${c.user.name}`}
          />
          <span>Inserir Atletas</span>
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={onGenerateLink} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs font-medium rounded-lg hover:bg-white/10 cursor-pointer">
            <LinkIcon /><span>Link</span>
          </button>
          <button type="button" onClick={onEdit} className="px-2.5 py-1.5 bg-telemetry-blue text-white text-xs font-medium rounded-lg hover:opacity-90 cursor-pointer">
            Editar
          </button>
          {onDelete && (
            <button type="button" onClick={onDelete} className="px-2.5 py-1.5 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-xs font-medium rounded-lg hover:bg-telemetry-alert/20 cursor-pointer">
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
