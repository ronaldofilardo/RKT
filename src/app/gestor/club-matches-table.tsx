'use client';

import { Fragment, useState } from 'react';
import type { ClubMatchItem } from './types';
import { ClubMatchRow } from './club-match-row';
import { ClubMatchGroupHeader } from './club-match-group-header';
import { ClubMatchesFilterBar } from './club-matches-filter-bar';
import { ExternalScheduledMatchesSection } from './external-scheduled-matches-section';
import { filterByAnnotator, groupClubMatches, listAnnotators } from './group-club-matches.logic';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';

export type MatchSubTab = 'my_club' | 'others';

interface ClubMatchesTableProps {
  matches: ClubMatchItem[];
  externalMatches?: ClubMatchItem[];
  loading?: boolean;
  currentUserId?: string;
  onCreateMatch?: () => void;
  onAssignCoach?: (match: ClubMatchItem) => void;
  onDeleteMatch?: (match: ClubMatchItem) => void;
  onAnnotateMatch?: (match: ClubMatchItem) => void;
  onEditMatchInfo?: (match: ClubMatchItem) => void;
}

const HEAD_CELLS = ['Data', 'Confronto', 'Placar', 'Formato', 'Anotador / Criador', 'Status', 'Ações'];

export function ClubMatchesTable({
  matches, externalMatches = [], loading, currentUserId, onCreateMatch, onAssignCoach, onDeleteMatch, onAnnotateMatch, onEditMatchInfo,
}: ClubMatchesTableProps) {
  const floating = useFloatingSpectatorOptional();
  const [subTab, setSubTab] = useState<MatchSubTab>('my_club');
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

  const externalCount = externalMatches.length;

  return (
    <div className="p-0 sm:p-6 space-y-6">
      {/* Sub-abas internas: Meu clube / Outros */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          role="tablist"
          aria-label="Origem das partidas"
          className="inline-flex p-1 bg-telemetry-elevated/70 border border-telemetry-border/30 rounded-xl gap-1"
        >
          <button
            type="button"
            role="tab"
            id="subtab-my-club"
            aria-selected={subTab === 'my_club'}
            aria-controls="subtab-panel-my-club"
            onClick={() => setSubTab('my_club')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'my_club'
                ? 'bg-telemetry-card text-white shadow-sm border border-telemetry-blue-light/40'
                : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
            }`}
          >
            <span>Meu clube</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                subTab === 'my_club'
                  ? 'bg-telemetry-blue/30 text-telemetry-blue-light'
                  : 'bg-white/5 text-telemetry-text-muted'
              }`}
            >
              {matches.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            id="subtab-others"
            aria-selected={subTab === 'others'}
            aria-controls="subtab-panel-others"
            onClick={() => setSubTab('others')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'others'
                ? 'bg-telemetry-card text-white shadow-sm border border-telemetry-blue-light/40'
                : 'text-telemetry-text-muted hover:text-telemetry-text-primary'
            }`}
          >
            <span>Outros</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                externalCount > 0
                  ? 'bg-telemetry-volt/20 text-telemetry-volt border border-telemetry-volt/30'
                  : 'bg-white/5 text-telemetry-text-muted'
              }`}
            >
              {externalCount}
            </span>
          </button>
        </div>
      </div>

      {subTab === 'my_club' ? (
        <div id="subtab-panel-my-club" role="tabpanel" aria-labelledby="subtab-my-club" className="space-y-6">
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
      ) : (
        <div id="subtab-panel-others" role="tabpanel" aria-labelledby="subtab-others" className="space-y-6">
          {externalCount === 0 ? (
            <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
              <p className="text-telemetry-text-muted text-sm">
                Nenhuma partida agendada por outros clubes ou treinadores externos envolvendo atletas deste clube no momento.
              </p>
            </div>
          ) : (
            <ExternalScheduledMatchesSection
              externalMatches={externalMatches}
              onAssignCoach={onAssignCoach}
              onAnnotate={onAnnotateMatch}
              onEditInfo={onEditMatchInfo}
            />
          )}
        </div>
      )}
    </div>
  );
}
