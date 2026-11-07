'use client';

import type { ClubMatchItem } from './types';
import Link from 'next/link';
import { formatClubMatchScore, getMatchFormatDisplayLabel, getMatchFormatShortLabel } from './club-matches.logic';
import { TimelineIcon } from './timeline-icon';
import { getStateBadge, getStateLabel, opensLiveView } from './club-match-helpers';

interface ClubMatchRowProps {
  match: ClubMatchItem;
  floating?: { open: (matchId: string, title: string) => void } | null;
}

export function ClubMatchRow({ match, floating }: ClubMatchRowProps) {
  const m = match;
  const openLive = opensLiveView(m.state) && floating;

  return (
    <tr key={m.id} className="hover:bg-telemetry-elevated/40 transition-colors">
      <td className="px-3 py-4 text-xs text-telemetry-text-muted whitespace-nowrap">
        {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </td>
      <td className="px-3 py-4 text-sm text-telemetry-text-primary font-medium">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{m.player1?.name || 'Jogador 1'}</span>
          {m.player1?.club && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">
              {m.player1.club}
            </span>
          )}
        </div>
        <span className="text-telemetry-text-muted font-normal text-xs my-0.5 block">vs</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{m.player2?.name || 'Jogador 2'}</span>
          {m.player2?.club && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border border-telemetry-border/20 bg-telemetry-elevated/70 text-telemetry-text-muted">
              {m.player2.club}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-4 text-xs font-mono font-semibold text-telemetry-text-primary whitespace-nowrap">
        {formatClubMatchScore(m.scoreState, m.format, m.state)}
      </td>
      <td className="hidden md:table-cell px-3 py-4 text-xs text-telemetry-text-muted">
        <span title={getMatchFormatDisplayLabel(m.format)}>
          {getMatchFormatShortLabel(m.format)}
        </span>
      </td>
      <td className="hidden md:table-cell px-3 py-4 text-xs text-telemetry-text-muted">
        {m.createdByUser?.name || 'Anotador'}
      </td>
      <td className="px-3 py-4 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStateBadge(m.state)}`}>
          {getStateLabel(m.state)}
        </span>
      </td>
      <td className="px-3 py-4 text-sm text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-3">
          {openLive ? (
            <button
              type="button"
              onClick={() => floating!.open(m.id, `${m.player1?.name || 'Jogador 1'} × ${m.player2?.name || 'Jogador 2'}`)}
              className="text-xs text-telemetry-blue hover:underline font-medium"
            >
              Ver Partida
            </button>
          ) : (
            <Link
              href={opensLiveView(m.state) ? `/matches/acompanhar/${m.id}` : `/match/${m.id}/report`}
              className="text-xs text-telemetry-blue hover:underline font-medium"
            >
              Ver Partida
            </Link>
          )}
          <Link
            href={`/match/${m.id}/report`}
            aria-label="Ver timeline"
            title="Ver timeline da partida"
            className="inline-flex items-center text-telemetry-text-muted hover:text-telemetry-blue transition-colors"
          >
            <TimelineIcon />
          </Link>
        </div>
      </td>
    </tr>
  );
}