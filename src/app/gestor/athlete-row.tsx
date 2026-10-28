'use client';

import type { AthleteItem } from './types';

interface AthleteRowProps {
  athlete: AthleteItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onGenerateLink: () => void;
}

export function AthleteRow({ athlete: a, selected, onSelect, onEdit, onGenerateLink }: AthleteRowProps) {
  const cpfRaw = a.player.user?.cpf || a.player.cpf;
  const formattedCpf = cpfRaw
    ? cpfRaw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '-';

  return (
    <tr className="border-b border-telemetry-border opacity-10 hover:bg-telemetry-elevated opacity-30">
      <td className="py-3 text-sm">
        <input
          id={`atleta-select-${a.player.id}`}
          type="checkbox"
          aria-label={`Selecionar ${a.player.name}`}
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
        />
      </td>
      <td className="py-3 text-sm text-telemetry-text-primary font-medium">{a.player.name}</td>
      <td className="py-3 text-sm text-telemetry-text-muted font-mono text-xs">{formattedCpf}</td>
      <td className="py-3 text-sm text-telemetry-text-muted">{a.player.gender}</td>
      <td className="py-3 text-sm text-telemetry-text-muted">{a.player.dominance || '-'}</td>
      <td className="py-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
          a.player.user?.mustChangePassword ? 'bg-telemetry-alert text-telemetry-alert opacity-20' : 'bg-telemetry-volt text-telemetry-volt opacity-20'
        }`}>
          {a.player.user?.mustChangePassword ? 'Senha pendente' : 'Ativo'}
        </span>
      </td>
      <td className="py-3 text-sm whitespace-nowrap text-right">
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

