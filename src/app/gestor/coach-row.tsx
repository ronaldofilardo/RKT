'use client';

import type { CoachItem } from './types';

interface CoachRowProps {
  coach: CoachItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onGenerateLink: () => void;
  onToggleCanInsertAthletes: (checked: boolean) => void;
}

export function CoachRow({ coach: c, selected, onSelect, onEdit, onGenerateLink, onToggleCanInsertAthletes }: CoachRowProps) {
  const formattedCpf = c.user.cpf
    ? c.user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '-';

  return (
    <tr className="border-b border-telemetry-border opacity-10 hover:bg-telemetry-elevated opacity-30">
      <td className="py-3 text-sm">
        <input
          id={`treinador-select-${c.user.id}`}
          type="checkbox"
          aria-label={`Selecionar ${c.user.name}`}
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
        />
      </td>
      <td className="py-3 text-sm text-telemetry-text-primary font-medium">{c.user.name}</td>
      <td className="py-3 text-sm text-telemetry-text-muted font-mono text-xs">{formattedCpf}</td>
      <td className="py-3 text-sm text-telemetry-text-muted">{c.user.email}</td>
      <td className="py-3 text-sm text-telemetry-text-muted">{new Date(c.user.createdAt).toLocaleDateString('pt-BR')}</td>
      <td className="py-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.user.mustChangePassword ? 'bg-telemetry-alert text-telemetry-alert opacity-20' : 'bg-telemetry-volt text-telemetry-volt opacity-20'}`}>
          {c.user.mustChangePassword ? 'Senha pendente' : 'Ativo'}
        </span>
      </td>
      <td className="py-3 text-sm whitespace-nowrap text-right">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={c.canInsertAthletes}
            onChange={(e) => onToggleCanInsertAthletes(e.target.checked)}
            className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
            aria-label={`Permitir cadastro de atletas para ${c.user.name}`}
          />
          <span className="text-xs text-telemetry-text-muted">Inserir atletas</span>
        </label>
        <button
          onClick={onGenerateLink}
          className="text-xs text-telemetry-alert hover:underline mr-3 font-medium"
          title="Gerar link de redefinição de senha"
        >
          Link Senha
        </button>
        <button
          onClick={onEdit}
          className="text-xs text-telemetry-blue hover:underline font-medium"
        >
          Editar
        </button>
      </td>
    </tr>
  );
}
