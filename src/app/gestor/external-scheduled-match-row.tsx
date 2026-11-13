'use client';

import type { ClubMatchItem } from './types';
import { resolveCreatorRoleLabel, resolvePlayerAffiliation } from './gestor-match-display.logic';
import { getMatchFormatDisplayLabel, getMatchFormatShortLabel } from './club-matches.logic';

interface ExternalScheduledMatchRowProps {
  match: ClubMatchItem;
  onAssignCoach?: (match: ClubMatchItem) => void;
  onAnnotate?: (match: ClubMatchItem) => void;
}

export function ExternalScheduledMatchRow({
  match: m,
  onAssignCoach,
  onAnnotate,
}: ExternalScheduledMatchRowProps) {
  const dateDisplay = m.scheduledAt || m.createdAt;
  const formattedDate = new Date(dateDisplay).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const creatorRole = m.creatorRoleLabel || resolveCreatorRoleLabel(m.createdByUser);
  const p1Aff = resolvePlayerAffiliation(m.player1, Boolean(m.player1.isClubAthlete));
  const p2Aff = resolvePlayerAffiliation(m.player2, Boolean(m.player2.isClubAthlete));

  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3 text-xs text-telemetry-text-muted whitespace-nowrap">{formattedDate}</td>
      <td className="px-4 py-3 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-telemetry-text-primary">{m.player1.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-telemetry-text-muted border border-white/10">
              {p1Aff.label}
            </span>
          </div>
          <span className="text-telemetry-text-muted text-[10px]">vs</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-telemetry-text-primary">{m.player2.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-telemetry-text-muted border border-white/10">
              {p2Aff.label}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs">
        <p className="font-medium text-telemetry-text-primary">{m.createdByUser?.name ?? 'Criador externo'}</p>
        <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-telemetry-volt/15 text-telemetry-volt border border-telemetry-volt/30">
          {creatorRole}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-telemetry-text-muted">
        <span title={getMatchFormatDisplayLabel(m.format)}>{getMatchFormatShortLabel(m.format)}</span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          {onAnnotate && (
            <button
              type="button"
              onClick={() => onAnnotate(m)}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-telemetry-volt/20 text-telemetry-volt hover:bg-telemetry-volt/30 transition-colors"
            >
              Anotar
            </button>
          )}
          {onAssignCoach && (
            <button
              type="button"
              onClick={() => onAssignCoach(m)}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-telemetry-blue hover:bg-telemetry-blue/80 text-white shadow-sm transition-colors"
            >
              Indicar Anotador
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
