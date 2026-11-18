'use client';

import { useState } from 'react';
import type { ClubMatchItem } from './types';
import { ExternalScheduledMatchesSection } from './external-scheduled-matches-section';
import { filterByAnnotator, groupClubMatches, listAnnotators } from './group-club-matches.logic';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';
import { ClubMatchesSubTabs } from './club-matches-sub-tabs';
import { ClubMatchesMyClubPanel } from './club-matches-my-club-panel';

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
  matches, externalMatches = [], loading, currentUserId, onCreateMatch,
  onAssignCoach, onDeleteMatch, onAnnotateMatch, onEditMatchInfo,
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

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <ClubMatchesSubTabs subTab={subTab} onSubTabChange={setSubTab} matchesCount={matches.length} externalCount={externalMatches.length} />

      {subTab === 'my_club' ? (
        <ClubMatchesMyClubPanel
          groups={groups} annotators={annotators} annotator={annotator} onlyDesignated={onlyDesignated}
          collapsed={collapsed} headCells={HEAD_CELLS} currentUserId={currentUserId} floating={floating}
          onAnnotatorChange={setAnnotator} onOnlyDesignatedChange={setOnlyDesignated} onToggleCollapse={toggleCollapse}
          onCreateMatch={onCreateMatch} onAssignCoach={onAssignCoach} onDeleteMatch={onDeleteMatch}
          onAnnotateMatch={onAnnotateMatch} onEditMatchInfo={onEditMatchInfo}
        />
      ) : (
        <div id="subtab-panel-others" role="tabpanel" aria-labelledby="subtab-others" className="space-y-6">
          {externalMatches.length === 0 ? (
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
