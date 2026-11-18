import type { ClubMatchItem } from './types';

export interface PlayerAffiliationInfo {
  isOwn: boolean;
  label: string;
}

interface PlayersCellProps {
  match: ClubMatchItem;
  isDoubles: boolean;
  p1Aff: PlayerAffiliationInfo;
  p2Aff: PlayerAffiliationInfo;
  p1PartnerAff: PlayerAffiliationInfo | null;
  p2PartnerAff: PlayerAffiliationInfo | null;
}

export function ClubMatchPlayersCell({
  match: m,
  isDoubles,
  p1Aff,
  p2Aff,
  p1PartnerAff,
  p2PartnerAff,
}: PlayersCellProps) {
  return (
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
  );
}
