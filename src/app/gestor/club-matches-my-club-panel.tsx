import { Fragment } from 'react';
import type { ClubMatchItem } from './types';
import type { ClubMatchGroup, ClubAnnotatorOption } from './group-club-matches.logic';
import { ClubMatchRow } from './club-match-row';
import { ClubMatchGroupHeader } from './club-match-group-header';
import { ClubMatchesFilterBar } from './club-matches-filter-bar';

interface MyClubPanelProps {
  groups: ClubMatchGroup[];
  annotators: ClubAnnotatorOption[];
  annotator: string;
  onlyDesignated: boolean;
  collapsed: Set<string>;
  headCells: string[];
  currentUserId?: string;
  floating?: { open: (matchId: string, title: string) => void } | null;
  onAnnotatorChange: (a: string) => void;
  onOnlyDesignatedChange: (v: boolean) => void;
  onToggleCollapse: (key: string) => void;
  onCreateMatch?: () => void;
  onAssignCoach?: (match: ClubMatchItem) => void;
  onDeleteMatch?: (match: ClubMatchItem) => void;
  onAnnotateMatch?: (match: ClubMatchItem) => void;
  onEditMatchInfo?: (match: ClubMatchItem) => void;
}

export function ClubMatchesMyClubPanel({
  groups, annotators, annotator, onlyDesignated, collapsed, headCells,
  currentUserId, floating, onAnnotatorChange, onOnlyDesignatedChange, onToggleCollapse,
  onCreateMatch, onAssignCoach, onDeleteMatch, onAnnotateMatch, onEditMatchInfo,
}: MyClubPanelProps) {
  return (
    <div id="subtab-panel-my-club" role="tabpanel" aria-labelledby="subtab-my-club" className="space-y-6">
      <ClubMatchesFilterBar
        annotators={annotators} annotator={annotator} onlyDesignated={onlyDesignated}
        onAnnotatorChange={onAnnotatorChange} onOnlyDesignatedChange={onOnlyDesignatedChange} onCreateMatch={onCreateMatch}
      />
      {groups.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
          <p className="text-telemetry-text-muted text-sm">Nenhuma partida registrada por treinadores ou atletas deste clube ainda.</p>
        </div>
      ) : (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border/40">
                {headCells.map((cell) => <th key={cell} className="px-3 py-4 text-sm font-medium text-telemetry-text-primary">{cell}</th>)}
              </tr>
            </thead>
            {groups.map((group) => {
              const isCollapsed = collapsed.has(group.key);
              return (
                <tbody key={group.key} className="divide-y divide-telemetry-border/20">
                  <ClubMatchGroupHeader group={group} colSpan={headCells.length} collapsed={isCollapsed} onToggleCollapse={onToggleCollapse} onAssignCoach={onAssignCoach} />
                  {!isCollapsed && group.matches.length === 0 && (
                    <tr><td colSpan={headCells.length} className="px-3 py-3 text-xs text-telemetry-text-muted italic">Nenhuma anotação iniciada ainda para esta partida.</td></tr>
                  )}
                  {!isCollapsed && group.matches.map((m) => (
                    <Fragment key={m.id}>
                      <ClubMatchRow match={m} currentUserId={currentUserId} floating={floating} onAssign={onAssignCoach} onAnnotate={onAnnotateMatch} onDelete={onDeleteMatch} onEditInfo={onEditMatchInfo} />
                    </Fragment>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}
