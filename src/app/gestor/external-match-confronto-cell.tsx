import type { ClubMatchItem } from './types';
import type { PlayerAffiliationInfo } from './club-match-players-cell';

interface ConfrontoCellProps {
  match: ClubMatchItem;
  p1SideTitle: string;
  p2SideTitle: string;
  isDoubles: boolean;
  p1Aff: PlayerAffiliationInfo;
  p2Aff: PlayerAffiliationInfo;
  p1PartnerAff: PlayerAffiliationInfo | null;
  p2PartnerAff: PlayerAffiliationInfo | null;
}

export function ExternalMatchConfrontoCell({
  match: m,
  p1SideTitle,
  p2SideTitle,
  isDoubles,
  p1Aff,
  p2Aff,
  p1PartnerAff,
  p2PartnerAff,
}: ConfrontoCellProps) {
  return (
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
  );
}
