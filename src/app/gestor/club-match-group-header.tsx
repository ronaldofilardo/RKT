'use client';

import type { ClubMatchItem } from './types';
import type { ClubMatchGroup } from './group-club-matches.logic';
import { ClubMatchScopeBadge } from './club-match-scope-badge';
import { ClubMatchGroupDesignees } from './club-match-group-designees';

interface ClubMatchGroupHeaderProps {
  group: ClubMatchGroup;
  colSpan: number;
  collapsed: boolean;
  onToggleCollapse: (key: string) => void;
  onAssignCoach?: (match: ClubMatchItem) => void;
  onAnnotateCoach?: (match: ClubMatchItem) => void;
  currentUserId?: string;
}

export function ClubMatchGroupHeader({
  group,
  colSpan,
  collapsed,
  onToggleCollapse,
  onAssignCoach,
  onAnnotateCoach,
  currentUserId,
}: ClubMatchGroupHeaderProps) {
  const isPrivateStandalone = group.key === 'private';
  const isDoubles =
    group.template?.matchType === 'DOUBLES' ||
    group.source?.matchType === 'DOUBLES' ||
    Boolean(
      group.template?.player1Partner || group.source?.player1Partner ||
      group.template?.player2Partner || group.source?.player2Partner,
    );

  const p1PartnerName = group.source?.player1Partner?.name || group.template?.player1Partner?.name;
  const p2PartnerName = group.source?.player2Partner?.name || group.template?.player2Partner?.name;
  const p1Name = p1PartnerName
    ? `${group.source?.player1?.name || group.template?.player1?.name || 'Jogador 1'} / ${p1PartnerName}`
    : (group.source?.player1?.name || group.template?.player1?.name || 'Jogador 1');
  const p2Name = p2PartnerName
    ? `${group.source?.player2?.name || group.template?.player2?.name || 'Jogador 2'} / ${p2PartnerName}`
    : (group.source?.player2?.name || group.template?.player2?.name || 'Jogador 2');

  const matchTitle = group.source
    ? `${isDoubles ? '[Duplas] ' : ''}${p1Name} × ${p2Name}`
    : 'Partidas privadas / avulsas';

  const assignTarget = group.template ?? group.matches[0] ?? null;

  return (
    <tr className="bg-telemetry-elevated/50">
      <th colSpan={colSpan} scope="colgroup" className="px-3 py-2.5 text-left text-xs font-semibold text-telemetry-text-primary">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onToggleCollapse(group.key)}
            aria-expanded={!collapsed}
            className="flex items-center gap-2 text-left hover:text-telemetry-blue-light transition-colors cursor-pointer"
          >
            <span aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
            {group.source && <ClubMatchScopeBadge scope={group.source.eventScope} />}
            <span>{matchTitle}</span>
            <span className="text-[11px] font-normal text-telemetry-text-muted">
              · {group.matches.length} {group.matches.length === 1 ? 'anotação' : 'anotações'}
            </span>
          </button>

          {!isPrivateStandalone && (
            <ClubMatchGroupDesignees
              group={group}
              assignTarget={assignTarget}
              onAssignCoach={onAssignCoach}
              onAnnotate={onAnnotateCoach}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </th>
    </tr>
  );
}
