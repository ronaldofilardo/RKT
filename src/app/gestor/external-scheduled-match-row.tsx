'use client';

import type { ClubMatchItem } from './types';
import { resolveCreatorRoleLabel, resolvePlayerAffiliation } from './gestor-match-display.logic';
import { getMatchFormatDisplayLabel, getMatchFormatShortLabel } from './club-matches.logic';
import { ExternalMatchConfrontoCell } from './external-match-confronto-cell';

interface ExternalScheduledMatchRowProps {
  match: ClubMatchItem;
  onAssignCoach?: (match: ClubMatchItem) => void;
  onAnnotate?: (match: ClubMatchItem) => void;
  onEditInfo?: (match: ClubMatchItem) => void;
}

export function ExternalScheduledMatchRow({
  match: m,
  onAssignCoach,
  onAnnotate,
  onEditInfo,
}: ExternalScheduledMatchRowProps) {
  const isDoubles = m.matchType === 'DOUBLES' || Boolean(m.player1Partner || m.player2Partner);
  const p1PartnerName = m.player1Partner?.name;
  const p2PartnerName = m.player2Partner?.name;
  const p1SideTitle = p1PartnerName ? `${m.player1.name} / ${p1PartnerName}` : m.player1.name;
  const p2SideTitle = p2PartnerName ? `${m.player2.name} / ${p2PartnerName}` : m.player2.name;
  const dateDisplay = m.scheduledAt || m.createdAt;
  const formattedDate = new Date(dateDisplay).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const creatorRole = m.creatorRoleLabel || resolveCreatorRoleLabel(m.createdByUser);
  const p1Aff = resolvePlayerAffiliation(m.player1, Boolean(m.player1.isClubAthlete));
  const p2Aff = resolvePlayerAffiliation(m.player2, Boolean(m.player2.isClubAthlete));
  const p1PartnerAff = m.player1Partner ? resolvePlayerAffiliation(m.player1Partner, Boolean(m.player1Partner.isClubAthlete)) : null;
  const p2PartnerAff = m.player2Partner ? resolvePlayerAffiliation(m.player2Partner, Boolean(m.player2Partner.isClubAthlete)) : null;

  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3 text-xs text-telemetry-text-muted whitespace-nowrap">{formattedDate}</td>
      <ExternalMatchConfrontoCell
        match={m} p1SideTitle={p1SideTitle} p2SideTitle={p2SideTitle} isDoubles={isDoubles}
        p1Aff={p1Aff} p2Aff={p2Aff} p1PartnerAff={p1PartnerAff} p2PartnerAff={p2PartnerAff}
      />
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
        <div className="inline-flex items-center gap-1">
          {onEditInfo && (
            <button
              type="button" onClick={() => onEditInfo(m)} title="Editar informações da partida" aria-label="Editar informações da partida"
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary text-xs sm:text-sm font-medium rounded-lg hover:bg-white/10 transition-colors shadow-sm cursor-pointer"
            >
              <span>Info.</span>
            </button>
          )}
          {onAnnotate && (
            <button
              type="button" onClick={() => onAnnotate(m)}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-volt/20 border border-telemetry-volt/40 text-telemetry-volt hover:bg-telemetry-volt/30 text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Anotar
            </button>
          )}
          {onAssignCoach && (
            <button
              type="button" onClick={() => onAssignCoach(m)}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-blue text-white text-xs sm:text-sm font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm cursor-pointer"
            >
              Indicar Anotador
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
