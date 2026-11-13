import type { AthleteTableRowActions, AthleteTableRowData } from './athlete-table.types';
import { AthleteRankingsCell } from './athlete-rankings-cell';
import { AthleteRowActions } from './athlete-row-actions';
import { AthleteStatusBadge } from './athlete-status-badge';
import { computeAthleteAge, formatAthleteCpf, formatBirthDate, genderLabel } from '@/lib/athlete-labels.logic';

interface AthleteTableRowProps {
  athlete: AthleteTableRowData;
  actions: AthleteTableRowActions;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export function AthleteTableRow({
  athlete: a, actions, selectable, selected, onSelect,
}: AthleteTableRowProps) {
  const birthDateLabel = formatBirthDate(a.birthDate);
  const age = computeAthleteAge(a.birthDate, a.age);

  return (
    <tr className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
      {selectable && (
        <td className="px-3 py-3 text-sm">
          <input
            id={`atleta-select-${a.id}`}
            type="checkbox"
            aria-label={`Selecionar ${a.name}`}
            checked={Boolean(selected)}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded"
          />
        </td>
      )}

      <td className="px-3 py-3 text-sm text-telemetry-text-primary font-medium">{a.name}</td>

      <td className="px-3 py-3 text-sm font-mono text-xs">
        {a.nickname ? (
          <span className="text-telemetry-volt font-medium">@{a.nickname}</span>
        ) : (
          <span className="text-telemetry-text-muted">-</span>
        )}
      </td>

      <td className="px-3 py-3 text-sm text-telemetry-text-primary font-mono text-xs">
        {formatAthleteCpf(a.cpf, a.cpfLast2)}
      </td>

      <td className="px-3 py-3 text-sm text-telemetry-text-primary">{genderLabel(a.gender)}</td>

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
        <AthleteRankingsCell rankings={a.rankings} />
      </td>

      <td className="px-3 py-3 text-sm">
        <AthleteStatusBadge status={a.status} />
      </td>

      <td className="px-3 py-3 text-sm whitespace-nowrap text-right">
        <AthleteRowActions
          athlete={a}
          canDelete={Boolean(actions.canDelete)}
          isClubCoach={actions.isClubCoach}
          isUnder18={actions.isUnder18}
          editLabel={actions.editLabel}
          editDisabledReason={actions.editDisabledReason}
          hasAccount={actions.hasAccount}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
          onGenerateLink={actions.onGenerateLink ? () => actions.onGenerateLink?.() : undefined}
          loadingLink={actions.loadingLink}
        />
      </td>
    </tr>
  );
}
