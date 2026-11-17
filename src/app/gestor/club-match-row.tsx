'use client';

import type { ClubMatchItem } from './types';
import Link from 'next/link';
import { formatClubMatchScore, getMatchFormatDisplayLabel, getMatchFormatShortLabel } from './club-matches.logic';
import { TimelineIcon } from './timeline-icon';
import { getStateBadge, getStateLabel, opensLiveView } from './club-match-helpers';
import { resolveCreatorRoleLabel, resolvePlayerAffiliation } from './gestor-match-display.logic';

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
  const openLive = opensLiveView(m.state) && floating;
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
  const isCreator = Boolean(currentUserId && m.createdByUserId === currentUserId);
  const p1Aff = resolvePlayerAffiliation(m.player1, Boolean(m.player1.isClubAthlete));
  const p2Aff = resolvePlayerAffiliation(m.player2, Boolean(m.player2.isClubAthlete));
  const p1PartnerAff = m.player1Partner ? resolvePlayerAffiliation(m.player1Partner, Boolean(m.player1Partner.isClubAthlete)) : null;
  const p2PartnerAff = m.player2Partner ? resolvePlayerAffiliation(m.player2Partner, Boolean(m.player2Partner.isClubAthlete)) : null;

  return (
    <tr key={m.id} className="hover:bg-telemetry-elevated/40 transition-colors">
      <td className="px-3 py-4 text-xs text-telemetry-text-muted whitespace-nowrap">
        {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </td>
      <td className="px-3 py-4 text-sm text-telemetry-text-primary font-medium">
        {isDoubles && (
          <div className="mb-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-telemetry-blue/20 text-telemetry-blue-light border border-telemetry-blue-light/30">
              Duplas
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{m.player1?.name || 'Jogador 1'}</span>
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">{p1Aff.label}</span>
          {m.player1Partner && (
            <>
              <span className="text-telemetry-text-muted font-normal text-xs">/</span>
              <span>{m.player1Partner.name}</span>
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">{p1PartnerAff?.label}</span>
            </>
          )}
        </div>
        <span className="text-telemetry-text-muted font-normal text-xs my-0.5 block">vs</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{m.player2?.name || 'Jogador 2'}</span>
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">{p2Aff.label}</span>
          {m.player2Partner && (
            <>
              <span className="text-telemetry-text-muted font-normal text-xs">/</span>
              <span>{m.player2Partner.name}</span>
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">{p2PartnerAff?.label}</span>
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-4 text-xs font-mono font-semibold text-telemetry-text-primary whitespace-nowrap">
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
          {isDesignated && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-telemetry-volt/15 text-telemetry-volt border border-telemetry-volt/30">Designado (Oficial)</span>}
        </div>
      </td>
      <td className="px-3 py-4 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStateBadge(m.state)}`}>{getStateLabel(m.state)}</span>
      </td>
      <td className="px-3 py-4 text-sm text-right whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          {onAssign && !m.sourceMatchId && (
            <button
              type="button"
              onClick={() => onAssign(m)}
              title={hasDesignated ? 'Alterar treinadores designados' : 'Indicar treinador'}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
            >
              {hasDesignated ? 'Alterar' : 'Indicar'}
            </button>
          )}
          {onAnnotate && (
            <button
              type="button"
              onClick={() => onAnnotate(m)}
              title="Anotar partida"
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-volt/20 border border-telemetry-volt/40 text-telemetry-volt hover:bg-telemetry-volt/30 text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Anotar
            </button>
          )}
          {onEditInfo && (
            <button
              type="button"
              onClick={() => onEditInfo(m)}
              title="Editar informações da partida"
              aria-label="Editar informações da partida"
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
            >
              <span>Info.</span>
            </button>
          )}
          {openLive ? (
            <button
              type="button"
              onClick={() => floating!.open(m.id, matchTitle)}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer"
            >
              Ver Partida
            </button>
          ) : (
            <Link
              href={opensLiveView(m.state) ? `/matches/acompanhar/${m.id}` : `/match/${m.id}/report`}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer"
            >
              Ver Partida
            </Link>
          )}
          <Link
            href={`/match/${m.id}/report`}
            aria-label="Ver timeline"
            title="Ver timeline da partida"
            className="inline-flex items-center justify-center px-2 py-1 sm:px-2.5 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
          >
            <TimelineIcon />
          </Link>
          {onDelete && isCreator && (
            <button
              type="button"
              onClick={() => onDelete(m)}
              title="Excluir partida"
              aria-label="Excluir partida"
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-xs sm:text-sm font-medium rounded-lg hover:bg-telemetry-alert/20 transition-colors shadow-sm cursor-pointer"
            >
              Excluir
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
