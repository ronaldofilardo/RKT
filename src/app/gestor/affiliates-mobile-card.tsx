import type { AffiliateAthleteItem } from './affiliates.types';
import { formatTechnicalSummary, formatLocation, formatRankings } from './affiliates-formatters';

interface AffiliatesMobileCardProps {
  athlete: AffiliateAthleteItem;
}

export function AffiliatesMobileCard({ athlete }: AffiliatesMobileCardProps) {
  const technical = formatTechnicalSummary(athlete);
  const location = formatLocation(athlete.city, athlete.state);
  const rankings = formatRankings(athlete.rankings);

  return (
    <div className="bg-telemetry-card rounded-xl border border-telemetry-border/20 p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm text-telemetry-text-primary truncate">{athlete.name}</p>
          <p className="text-xs text-telemetry-blue font-sans font-medium">
            {athlete.nickname ? `@${athlete.nickname}` : 'Sem nickname'}
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded bg-telemetry-surface border border-telemetry-border/30 text-telemetry-text-secondary shrink-0">
          {technical}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-telemetry-border/10">
        <div>
          <span className="text-[10px] text-telemetry-text-muted uppercase block">Afiliação</span>
          <span className="text-telemetry-text-primary">{athlete.clubName || athlete.coachName || 'Avulso'}</span>
        </div>
        <div>
          <span className="text-[10px] text-telemetry-text-muted uppercase block">Localidade</span>
          <span className="text-telemetry-text-secondary">{location}</span>
          {rankings !== '-' && <span className="block text-[11px] text-telemetry-blue">{rankings}</span>}
        </div>
      </div>
    </div>
  );
}
