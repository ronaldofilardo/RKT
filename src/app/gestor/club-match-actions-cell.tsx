import Link from 'next/link';
import type { ClubMatchItem } from './types';
import { TimelineIcon } from './timeline-icon';
import { opensLiveView } from './club-match-helpers';

interface ActionsCellProps {
  match: ClubMatchItem;
  hasDesignated: boolean;
  matchTitle: string;
  isCreator: boolean;
  openLive: boolean;
  floating?: { open: (matchId: string, title: string) => void } | null;
  onAssign?: (match: ClubMatchItem) => void;
  onAnnotate?: (match: ClubMatchItem) => void;
  onDelete?: (match: ClubMatchItem) => void;
  onEditInfo?: (match: ClubMatchItem) => void;
}

export function ClubMatchActionsCell({
  match: m,
  hasDesignated,
  matchTitle,
  isCreator,
  openLive,
  floating,
  onAssign,
  onAnnotate,
  onDelete,
  onEditInfo,
}: ActionsCellProps) {
  return (
    <td className="px-3 py-4 text-sm text-right whitespace-nowrap">
      <div className="inline-flex items-center gap-1">
        {onAssign && !m.sourceMatchId && (
          <button
            type="button" onClick={() => onAssign(m)}
            title={hasDesignated ? 'Alterar treinadores designados' : 'Designar treinadores'}
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
          >
            {hasDesignated ? 'Alterar' : 'Indicar'}
          </button>
        )}
        {onAnnotate && isCreator && (
          <button
            type="button" onClick={() => onAnnotate(m)} title={m.state === 'IN_PROGRESS' ? 'Continuar anotação' : 'Anotar partida'}
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-volt/20 border border-telemetry-volt/40 text-telemetry-volt hover:bg-telemetry-volt/30 text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            {m.state === 'IN_PROGRESS' ? 'Continuar' : 'Anotar'}
          </button>
        )}
        {onEditInfo && (
          <button
            type="button" onClick={() => onEditInfo(m)} title="Editar informações da partida" aria-label="Editar informações da partida"
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
          >
            <span>Info.</span>
          </button>
        )}
        {openLive ? (
          <button
            type="button" onClick={() => floating!.open(m.id, matchTitle)}
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
          href={`/match/${m.id}/report`} aria-label="Ver timeline" title="Ver timeline da partida"
          className="inline-flex items-center justify-center px-2 py-1 sm:px-2.5 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
        >
          <TimelineIcon />
        </Link>
        {onDelete && isCreator && (
          <button
            type="button" onClick={() => onDelete(m)} title="Excluir partida" aria-label="Excluir partida"
            className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-xs sm:text-sm font-medium rounded-lg hover:bg-telemetry-alert/20 transition-colors shadow-sm cursor-pointer"
          >
            Excluir
          </button>
        )}
      </div>
    </td>
  );
}
