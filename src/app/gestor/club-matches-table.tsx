'use client';

import { Fragment, useState } from 'react';
import type { ClubMatchItem } from './types';
import { ClubMatchRow } from './club-match-row';
import { ClubMatchGroupHeader } from './club-match-group-header';
import { ClubMatchesFilterBar } from './club-matches-filter-bar';
import { ExternalScheduledMatchesSection } from './external-scheduled-matches-section';
import { filterByAnnotator, groupClubMatches, listAnnotators } from './group-club-matches.logic';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';

interface ClubMatchesTableProps {
  matches: ClubMatchItem[];
  externalMatches?: ClubMatchItem[];
  loading?: boolean;
  currentUserId?: string;
  onCreateMatch?: () => void;
  onAssignCoach?: (match: ClubMatchItem) => void;
  onDeleteMatch?: (match: ClubMatchItem) => void;
  onAnnotateMatch?: (match: ClubMatchItem) => void;
}

const HEAD_CELLS = ['Data', 'Confronto', 'Placar', 'Formato', 'Anotador / Criador', 'Status', 'Ação'];

export function ClubMatchesTable({
  matches, externalMatches, loading, currentUserId, onCreateMatch, onAssignCoach, onDeleteMatch, onAnnotateMatch,
}: ClubMatchesTableProps) {
  const floating = useFloatingSpectatorOptional();
  const [annotator, setAnnotator] = useState('');
  const [onlyDesignated, setOnlyDesignated] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const annotators = listAnnotators(matches);
  const groups = groupClubMatches(filterByAnnotator(matches, annotator || null, onlyDesignated));

  const toggleCollapse = (key: string) => setCollapsed((p) => {
    const n = new Set(p);
    if (n.has(key)) n.delete(key); else n.add(key);
    return n;
  });

  if (loading) {
    return (
      <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
        <p className="text-telemetry-text-muted text-sm">Carregando partidas do clube...</p>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <ExternalScheduledMatchesSection externalMatches={externalMatches ?? []} onAssignCoach={onAssignCoach} onAnnotate={onAnnotateMatch} />
      <ClubMatchesFilterBar
        annotators={annotators}
        annotator={annotator}
        onlyDesignated={onlyDesignated}
        onAnnotatorChange={setAnnotator}
        onOnlyDesignatedChange={setOnlyDesignated}
        onCreateMatch={onCreateMatch}
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
                {HEAD_CELLS.map((cell) => <th key={cell} className="px-3 py-4 text-sm font-medium text-telemetry-text-primary">{cell}</th>)}
              </tr>
            </thead>
            {groups.map((group) => {
              const isCollapsed = collapsed.has(group.key);
              return (
                <tbody key={group.key} className="divide-y divide-telemetry-border/20">
                  <ClubMatchGroupHeader group={group} colSpan={HEAD_CELLS.length} collapsed={isCollapsed} onToggleCollapse={toggleCollapse} onAssignCoach={onAssignCoach} />
                  {!isCollapsed && group.matches.length === 0 && (
                    <tr><td colSpan={HEAD_CELLS.length} className="px-3 py-3 text-xs text-telemetry-text-muted italic">Nenhuma anotação iniciada ainda para esta partida.</td></tr>
                  )}
                  {!isCollapsed && group.matches.map((m) => (
                    <Fragment key={m.id}>
                      <ClubMatchRow match={m} currentUserId={currentUserId} floating={floating} onAssign={onAssignCoach} onAnnotate={onAnnotateMatch} onDelete={onDeleteMatch} />
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
