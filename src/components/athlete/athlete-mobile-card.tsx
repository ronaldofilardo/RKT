import type { AthleteTableRowActions, AthleteTableRowData } from './athlete-table.types';
import { AthleteRankingsCell } from './athlete-rankings-cell';
import { AthleteRowActions } from './athlete-row-actions';
import { AthleteStatusBadge } from './athlete-status-badge';
import { computeAthleteAge, formatAthleteCpf, formatBirthDate, genderLabel } from '@/lib/athlete-labels.logic';

interface AthleteMobileCardProps {
  athlete: AthleteTableRowData;
  actions: AthleteTableRowActions;
  selectable?: boolean;
  showOrigin?: boolean;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
}

export function AthleteMobileCard({
  athlete: a, actions, selectable, showOrigin, selected, onSelect,
}: AthleteMobileCardProps) {
  const birthDateLabel = formatBirthDate(a.birthDate);
  const age = computeAthleteAge(a.birthDate, a.age);

  return (
    <div className="bg-telemetry-card rounded-xl border border-telemetry-border/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {selectable && (
            <input
              type="checkbox"
              aria-label={`Selecionar ${a.name}`}
              checked={Boolean(selected)}
              onChange={(e) => onSelect?.(e.target.checked)}
              className="mt-1 w-4 h-4 text-telemetry-blue border-telemetry-border rounded shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-telemetry-text-primary truncate">{a.name}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-telemetry-text-muted mt-0.5">
              {a.nickname && <span className="text-telemetry-volt font-medium">@{a.nickname}</span>}
              <span className="font-sans tabular-nums">{formatAthleteCpf(a.cpf, a.cpfLast2)}</span>
              <span>{genderLabel(a.gender)}</span>
            </div>
          </div>
        </div>
        <AthleteStatusBadge status={a.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-telemetry-text-muted pt-2 border-t border-telemetry-border/10">
        <div>
          <span className="block text-[10px] uppercase tracking-wider">Nascimento</span>
          <span className="text-telemetry-text-primary font-sans tabular-nums">{birthDateLabel || '-'}</span>
          {age != null && <span className="ml-1">({age} anos)</span>}
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-wider">Ranking</span>
          <AthleteRankingsCell rankings={a.rankings} />
        </div>
        {showOrigin && a.origin && (
          <div className="col-span-2">
            <span className="text-[10px] uppercase tracking-wider mr-1.5">Origem:</span>
            <span className="text-telemetry-text-primary">{a.origin}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-telemetry-border/10">
        {a.isMinor ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Menor (Tutela)
          </span>
        ) : <span />}
        <AthleteRowActions
          athlete={a} canDelete={Boolean(actions.canDelete)} isClubCoach={actions.isClubCoach}
          isUnder18={actions.isUnder18} isMinorConsented={actions.isMinorConsented}
          editLabel={actions.editLabel} editDisabledReason={actions.editDisabledReason}
          hasAccount={actions.hasAccount} onEdit={actions.onEdit} onDelete={actions.onDelete}
          onGenerateLink={actions.onGenerateLink ? () => actions.onGenerateLink?.() : undefined}
          onEcaConsent={actions.onEcaConsent ? () => actions.onEcaConsent?.() : undefined}
          loadingLink={actions.loadingLink}
        />
      </div>
    </div>
  );
}
