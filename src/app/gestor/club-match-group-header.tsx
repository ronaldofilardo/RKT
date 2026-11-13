'use client';

import type { ClubMatchItem } from './types';
import type { ClubMatchGroup } from './group-club-matches.logic';

interface ClubMatchGroupHeaderProps {
  group: ClubMatchGroup;
  colSpan: number;
  collapsed: boolean;
  onToggleCollapse: (key: string) => void;
  onAssignCoach?: (match: ClubMatchItem) => void;
}

export function ClubMatchGroupHeader({
  group,
  colSpan,
  collapsed,
  onToggleCollapse,
  onAssignCoach,
}: ClubMatchGroupHeaderProps) {
  const isPrivateStandalone = group.key === 'private';
  const assignedName =
    group.template?.assignedCoach?.name ?? group.source?.assignedCoach?.name ?? null;
  const scopeIcon = group.source?.eventScope === 'PUBLIC' ? '📡' : '🔒';
  const title = group.source
    ? `${scopeIcon} ${group.source.player1?.name || 'Jogador 1'} × ${group.source.player2?.name || 'Jogador 2'} · ${group.matches.length} anotação(ões)`
    : 'Partidas privadas / avulsas';

  const assignTarget = group.template ?? group.matches[0] ?? null;

  return (
    <tr className="bg-telemetry-elevated/50">
      <th colSpan={colSpan} scope="colgroup" className="px-3 py-2.5 text-left text-xs font-semibold text-telemetry-text-primary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onToggleCollapse(group.key)}
            aria-expanded={!collapsed}
            className="flex items-center gap-2 text-left hover:text-telemetry-blue-light transition-colors"
          >
            <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
            <span>{title}</span>
          </button>

          {!isPrivateStandalone && (
            <div className="flex items-center gap-3 font-normal text-telemetry-text-muted">
              {assignedName && (
                <span>
                  Designado: <strong className="text-telemetry-blue-light">{assignedName}</strong>
                </span>
              )}
              {onAssignCoach && assignTarget && (
                <button
                  type="button"
                  onClick={() => onAssignCoach(assignTarget)}
                  className="text-xs text-telemetry-blue-light hover:underline font-medium"
                >
                  {assignedName ? 'Alterar designado' : 'Indicar anotador'}
                </button>
              )}
            </div>
          )}
        </div>
      </th>
    </tr>
  );
}

