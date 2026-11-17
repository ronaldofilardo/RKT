'use client';

import type { ClubMatchItem } from './types';
import { resolveCreatorRoleLabel, resolvePlayerAffiliation } from './gestor-match-display.logic';
import { getMatchFormatDisplayLabel, getMatchFormatShortLabel } from './club-matches.logic';

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
      <td className="px-4 py-3 text-xs" aria-label={`Confronto: ${p1SideTitle} vs ${p2SideTitle}`}>
        <div className="flex flex-col gap-1">
          {isDoubles && (
            <div className="mb-0.5">
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-telemetry-blue/20 text-telemetry-blue-light border border-telemetry-blue-light/30">
                Duplas
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-telemetry-text-primary">{m.player1.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-telemetry-text-muted border border-white/10">
              {p1Aff.label}
            </span>
            {m.player1Partner && (
              <>
                <span className="text-telemetry-text-muted text-[10px]">/</span>
                <span className="font-semibold text-telemetry-text-primary">{m.player1Partner.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-telemetry-text-muted border border-white/10">
                  {p1PartnerAff?.label}
                </span>
              </>
            )}
          </div>
          <span className="text-telemetry-text-muted text-[10px]">vs</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-telemetry-text-primary">{m.player2.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-telemetry-text-muted border border-white/10">
              {p2Aff.label}
            </span>
            {m.player2Partner && (
              <>
                <span className="text-telemetry-text-muted text-[10px]">/</span>
                <span className="font-semibold text-telemetry-text-primary">{m.player2Partner.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-telemetry-text-muted border border-white/10">
                  {p2PartnerAff?.label}
                </span>
              </>
            )}
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
        <div className="inline-flex items-center gap-1">
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
          {onAnnotate && (
            <button
              type="button"
              onClick={() => onAnnotate(m)}
              className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-telemetry-volt/20 border border-telemetry-volt/40 text-telemetry-volt hover:bg-telemetry-volt/30 text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Anotar
            </button>
          )}
          {onAssignCoach && (
            <button
              type="button"
              onClick={() => onAssignCoach(m)}
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
