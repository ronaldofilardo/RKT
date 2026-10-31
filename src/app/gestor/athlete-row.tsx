'use client';

import type { AthleteItem } from './types';
import { computeAthleteAge, formatBirthDate, genderLabel } from '@/lib/athlete-labels.logic';

interface AthleteRowProps {
  athlete: AthleteItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onGenerateLink: () => void;
}

export function AthleteRow({ athlete: a, selected, onSelect, onEdit, onGenerateLink }: AthleteRowProps) {
  const cpfRaw = a.player.user?.cpf || a.player.cpf;
  // Legado: atleta sem conta cadastrado antes da coluna `cpf` só tem os 2 últimos dígitos -> mascarado até ser reeditado.
  const formattedCpf = cpfRaw
    ? cpfRaw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : a.player.cpfLast2
      ? `***.***.***-${a.player.cpfLast2}`
      : '-';
  const birthDateLabel = formatBirthDate(a.player.birthDate);
  const age = computeAthleteAge(a.player.birthDate, a.player.age);

  return (
    <tr className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
      <td className="px-3 py-3 text-sm">
        <input
          id={`atleta-select-${a.player.id}`}
          type="checkbox"
          aria-label={`Selecionar ${a.player.name}`}
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
        />
      </td>
      <td className="px-3 py-3 text-sm text-telemetry-text-primary font-medium">{a.player.name}</td>
      <td className="px-3 py-3 text-sm text-telemetry-text-primary font-mono text-xs">{formattedCpf}</td>
      <td className="px-3 py-3 text-sm text-telemetry-text-primary">{genderLabel(a.player.gender)}</td>
      <td className="px-3 py-3 text-sm">
        {birthDateLabel ? (
          <span className="text-telemetry-text-primary">{birthDateLabel}</span>
        ) : (
          <span
            title="Data de nascimento não informada: necessária para a primeira senha de acesso"
            className="px-2 py-0.5 rounded text-xs font-bold bg-telemetry-alert/20 text-telemetry-alert border border-telemetry-alert/40 whitespace-nowrap"
          >
            Informar data
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-sm text-telemetry-text-primary">{age != null ? `${age} anos` : '-'}</td>
      <td className="px-3 py-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
          a.player.user?.mustChangePassword ? 'bg-telemetry-alert/20 text-telemetry-alert' : 'bg-telemetry-volt/20 text-telemetry-volt'
        }`}>
          {a.player.user?.mustChangePassword ? 'Senha pendente' : 'Ativo'}
        </span>
      </td>
      <td className="px-3 py-3 text-sm whitespace-nowrap text-right">
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
