'use client';

import type { ClubMatchItem } from './types';
import { formatClubMatchScore, getMatchFormatDisplayLabel, getMatchFormatShortLabel } from './club-matches.logic';
import { getStateBadge, getStateLabel, opensLiveView } from './club-match-formatters';
import { resolveCreatorRoleLabel, resolvePlayerAffiliation } from './gestor-match-display.logic';
import { ClubMatchPlayersCell } from './club-match-players-cell';
import { ClubMatchActionsCell } from './club-match-actions-cell';

interface ClubMatchRowProps {
  match: ClubMatchItem;
  currentUserId?: string;
  floating?: { open: (matchId: string, title: string) => void } | null;
  onAssign?: (match: ClubMatchItem) => void;
  onAnnotate?: (match: ClubMatchItem) => void;
  onDelete?: (match: ClubMatchItem) => void;
  onEditInfo?: (match: ClubMatchItem) => void;
}

export function ClubMatchRow({ match: m, currentUserId, floating, onAssign, onAnnotate, onDelete, onEditInfo }: ClubMatchRowProps) {
  const openLive = Boolean(opensLiveView(m.state) && floating);
  const isDoubles = m.matchType === 'DOUBLES' || Boolean(m.player1Partner || m.player2Partner);
  const p1PartnerName = m.player1Partner?.name;
  const p2PartnerName = m.player2Partner?.name;
  const p1SideTitle = p1PartnerName ? `${m.player1?.name || 'Jogador 1'} / ${p1PartnerName}` : (m.player1?.name || 'Jogador 1');
  const p2SideTitle = p2PartnerName ? `${m.player2?.name || 'Jogador 2'} / ${p2PartnerName}` : (m.player2?.name || 'Jogador 2');
  const matchTitle = isDoubles ? `[Duplas] ${p1SideTitle} × ${p2SideTitle}` : `${p1SideTitle} × ${p2SideTitle}`;
  const isDesignated = Boolean(m.isDesignatedAnnotator || m.isOfficialClubAnnotation);
  const assignedList = m.assignedCoaches?.map((ac) => ac.coach.name).filter(Boolean) ?? [];
  const annotatorName = assignedList.length > 0
    ? assignedList.join(', ')
    : (m.assignedCoach?.name || m.createdByUser?.name || 'Não indicado');
  const hasDesignated = assignedList.length > 0 || Boolean(m.assignedCoach);
  const creatorRole = m.creatorRoleLabel || resolveCreatorRoleLabel(m.createdByUser);
  const isCreator = currentUserId ? m.createdByUserId === currentUserId : true;
  const p1Aff = resolvePlayerAffiliation(m.player1, Boolean(m.player1.isClubAthlete));
  const p2Aff = resolvePlayerAffiliation(m.player2, Boolean(m.player2.isClubAthlete));
  const p1PartnerAff = m.player1Partner ? resolvePlayerAffiliation(m.player1Partner, Boolean(m.player1Partner.isClubAthlete)) : null;
  const p2PartnerAff = m.player2Partner ? resolvePlayerAffiliation(m.player2Partner, Boolean(m.player2Partner.isClubAthlete)) : null;

  return (
    <tr key={m.id} className="hover:bg-telemetry-elevated/40 transition-colors">
      <td className="px-3 py-4 text-xs text-telemetry-text-muted whitespace-nowrap">
        {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </td>
      <ClubMatchPlayersCell
        match={m} isDoubles={isDoubles} p1Aff={p1Aff} p2Aff={p2Aff}
        p1PartnerAff={p1PartnerAff} p2PartnerAff={p2PartnerAff}
      />
      <td className="px-3 py-4 text-xs font-sans tabular-nums font-semibold text-telemetry-text-primary whitespace-nowrap">
        <div>{formatClubMatchScore(m.scoreState, m.format, m.state)}</div>
        {typeof m.pointCount === 'number' && <div className="text-[10px] font-sans font-normal text-telemetry-text-muted mt-0.5">{m.pointCount} {m.pointCount === 1 ? 'ponto' : 'pontos'}</div>}
      </td>
      <td className="hidden md:table-cell px-3 py-4 text-xs text-telemetry-text-muted">
        <span title={getMatchFormatDisplayLabel(m.format)}>{getMatchFormatShortLabel(m.format)}</span>
      </td>
      <td className="hidden md:table-cell px-3 py-4 text-xs text-telemetry-text-muted">
        <div className="flex flex-col gap-1 items-start">
          <span className={isDesignated ? 'text-telemetry-volt font-semibold' : 'text-telemetry-text-primary'}>{annotatorName}</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] text-telemetry-text-muted border border-white/10 bg-white/5">{creatorRole}</span>
          {isDesignated ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-telemetry-volt/15 text-telemetry-volt border border-telemetry-volt/30">Designado (Oficial)</span>
          ) : m.sourceMatchId ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-telemetry-text-muted border border-white/10">Não oficial</span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-4 text-sm whitespace-nowrap">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap inline-flex items-center ${getStateBadge(m.state)}`}>{getStateLabel(m.state)}</span>
      </td>
      <ClubMatchActionsCell
        match={m} hasDesignated={hasDesignated} matchTitle={matchTitle} isCreator={isCreator}
        openLive={openLive} floating={floating} onAssign={onAssign} onAnnotate={onAnnotate}
        onDelete={onDelete} onEditInfo={onEditInfo}
      />
    </tr>
  );
}
