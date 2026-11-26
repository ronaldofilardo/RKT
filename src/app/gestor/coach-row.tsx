'use client';

import type { CoachItem } from './types';
import { LinkIcon } from '@/components/athlete/athlete-row-icons';

interface CoachRowProps {
  coach: CoachItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onGenerateLink: () => void;
  onToggleCanInsertAthletes: (checked: boolean) => void;
  onDelete?: () => void;
}

export function CoachRow({ coach: c, selected, onSelect, onEdit, onGenerateLink, onToggleCanInsertAthletes, onDelete }: CoachRowProps) {
  const formattedCpf = c.user.cpf
    ? c.user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '-';

  return (
    <tr className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
      <td className="px-3 py-3 text-sm">
        <input
          id={`treinador-select-${c.user.id}`}
          type="checkbox"
          aria-label={`Selecionar ${c.user.name}`}
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
        />
      </td>
      <td className="px-3 py-3 text-sm text-telemetry-text-primary font-medium">{c.user.name}</td>
      <td className="px-3 py-3 text-xs text-telemetry-text-muted/90 font-sans tabular-nums">{formattedCpf}</td>
      <td className="px-3 py-3 text-sm text-telemetry-text-muted/90">{c.user.email}</td>
      <td className="px-3 py-3 text-sm text-telemetry-text-muted/90 tabular-nums">{new Date(c.user.createdAt).toLocaleDateString('pt-BR')}</td>
      <td className="px-3 py-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.user.mustChangePassword ? 'bg-telemetry-alert/20 text-telemetry-alert' : 'bg-telemetry-volt/20 text-telemetry-volt'}`}>
          {c.user.mustChangePassword ? 'Senha pendente' : 'Ativo'}
        </span>
      </td>
      <td className="px-3 py-3 text-sm text-center">
        <label className="flex items-center justify-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={c.canInsertAthletes}
            onChange={(e) => onToggleCanInsertAthletes(e.target.checked)}
            className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
            aria-label={`Permitir cadastro de atletas para ${c.user.name}`}
          />
          <span className="text-[10px] text-telemetry-text-primary font-medium">Inserir Atletas</span>
        </label>
      </td>
      <td className="px-3 py-3 text-sm whitespace-nowrap text-right">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={onGenerateLink}
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
            title="Gerar link de redefinição de senha"
          >
            <LinkIcon /><span>Link Senha</span>
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer"
          >
            Editar
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-xs sm:text-sm font-medium rounded-lg hover:bg-telemetry-alert/20 transition-colors cursor-pointer"
              title="Excluir treinador"
            >
              Excluir
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
