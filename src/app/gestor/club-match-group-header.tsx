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
  const assignedCoachesList =
    group.template?.assignedCoaches ?? group.source?.assignedCoaches ?? [];
  const assignedLegacyName =
    group.template?.assignedCoach?.name ?? group.source?.assignedCoach?.name ?? null;

  const assignedNames =
    assignedCoachesList.length > 0
      ? assignedCoachesList.map((ac) => ac.coach.name).filter(Boolean)
      : assignedLegacyName
      ? [assignedLegacyName]
      : [];

  const scopeIcon = group.source?.eventScope === 'PUBLIC' ? '📡' : '🔒';
  const isDoubles =
    group.template?.matchType === 'DOUBLES' ||
    group.source?.matchType === 'DOUBLES' ||
    Boolean(
      group.template?.player1Partner ||
      group.source?.player1Partner ||
      group.template?.player2Partner ||
      group.source?.player2Partner,
    );

  const p1PartnerName = group.source?.player1Partner?.name || group.template?.player1Partner?.name;
  const p2PartnerName = group.source?.player2Partner?.name || group.template?.player2Partner?.name;
  const p1Name = p1PartnerName
    ? `${group.source?.player1?.name || group.template?.player1?.name || 'Jogador 1'} / ${p1PartnerName}`
    : (group.source?.player1?.name || group.template?.player1?.name || 'Jogador 1');
  const p2Name = p2PartnerName
    ? `${group.source?.player2?.name || group.template?.player2?.name || 'Jogador 2'} / ${p2PartnerName}`
    : (group.source?.player2?.name || group.template?.player2?.name || 'Jogador 2');

  const title = group.source
    ? `${scopeIcon} ${isDoubles ? '[Duplas] ' : ''}${p1Name} × ${p2Name} · ${group.matches.length} anotação(ões)`
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
              {assignedNames.length > 0 && (
                <span>
                  {assignedNames.length === 1 ? 'Designado: ' : 'Designados: '}
                  <strong className="text-telemetry-blue-light">{assignedNames.join(', ')}</strong>
                </span>
              )}
              {onAssignCoach && assignTarget && (
                <button
                  type="button"
                  onClick={() => onAssignCoach(assignTarget)}
                  className="text-xs text-telemetry-blue-light hover:underline font-medium"
                >
                  {assignedNames.length > 0 ? 'Gerenciar anotadores' : 'Indicar anotador'}
                </button>
              )}
            </div>
          )}
        </div>
      </th>
    </tr>
  );
}
