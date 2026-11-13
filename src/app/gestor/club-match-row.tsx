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
}

export function ClubMatchRow({ match: m, currentUserId, floating, onAssign, onAnnotate, onDelete }: ClubMatchRowProps) {
  const openLive = opensLiveView(m.state) && floating;
  const matchTitle = `${m.player1?.name || 'Jogador 1'} × ${m.player2?.name || 'Jogador 2'}`;
  const isDesignated = Boolean(m.isDesignatedAnnotator || m.isOfficialClubAnnotation);
  const annotatorName = m.assignedCoach?.name || m.createdByUser?.name || 'Não indicado';
  const creatorRole = m.creatorRoleLabel || resolveCreatorRoleLabel(m.createdByUser);
  const isCreator = Boolean(currentUserId && m.createdByUserId === currentUserId);
  const p1Aff = resolvePlayerAffiliation(m.player1, Boolean(m.player1.isClubAthlete));
  const p2Aff = resolvePlayerAffiliation(m.player2, Boolean(m.player2.isClubAthlete));

  return (
    <tr key={m.id} className="hover:bg-telemetry-elevated/40 transition-colors">
      <td className="px-3 py-4 text-xs text-telemetry-text-muted whitespace-nowrap">
        {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </td>
      <td className="px-3 py-4 text-sm text-telemetry-text-primary font-medium">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{m.player1?.name || 'Jogador 1'}</span>
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">{p1Aff.label}</span>
        </div>
        <span className="text-telemetry-text-muted font-normal text-xs my-0.5 block">vs</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{m.player2?.name || 'Jogador 2'}</span>
          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">{p2Aff.label}</span>
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
        <div className="flex items-center justify-end gap-2.5">
          {onAssign && !m.sourceMatchId && <button type="button" onClick={() => onAssign(m)} className="text-xs text-telemetry-blue-light hover:underline font-medium">{m.assignedCoach ? 'Alterar' : 'Indicar'}</button>}
          {onAnnotate && <button type="button" onClick={() => onAnnotate(m)} className="text-xs text-telemetry-volt hover:underline font-semibold">Anotar</button>}
          {openLive ? (
            <button type="button" onClick={() => floating!.open(m.id, matchTitle)} className="text-xs text-telemetry-blue hover:underline font-medium">Ver Partida</button>
          ) : (
            <Link href={opensLiveView(m.state) ? `/matches/acompanhar/${m.id}` : `/match/${m.id}/report`} className="text-xs text-telemetry-blue hover:underline font-medium">Ver Partida</Link>
          )}
          <Link href={`/match/${m.id}/report`} aria-label="Ver timeline" title="Ver timeline da partida" className="inline-flex items-center text-telemetry-text-muted hover:text-telemetry-blue transition-colors"><TimelineIcon /></Link>
          {onDelete && isCreator && <button type="button" onClick={() => onDelete(m)} title="Excluir partida" className="text-xs text-red-400 hover:text-red-300">🗑️</button>}
        </div>
      </td>
    </tr>
  );
}
