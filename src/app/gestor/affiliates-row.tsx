import type { AffiliateAthleteItem } from './affiliates.types';
import { formatTechnicalSummary, formatLocation, formatRankings } from './affiliates-helpers';

interface AffiliatesRowProps {
  athlete: AffiliateAthleteItem;
}

export function AffiliatesRow({ athlete }: AffiliatesRowProps) {
  const technical = formatTechnicalSummary(athlete);
  const location = formatLocation(athlete.city, athlete.state);
  const rankings = formatRankings(athlete.rankings);

  return (
    <tr className="border-b border-telemetry-border/10 hover:bg-telemetry-surface/40 transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium text-telemetry-text-primary">{athlete.name}</div>
        {athlete.nickname ? (
          <div className="text-xs text-telemetry-blue font-mono font-medium">@{athlete.nickname}</div>
        ) : (
          <div className="text-xs text-telemetry-text-muted">Sem nickname</div>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="space-y-0.5 text-xs">
          {athlete.clubName && (
            <div className="flex items-center gap-1.5 text-telemetry-text-primary">
              <span className="text-telemetry-text-muted">Clube:</span>
              <span className="font-medium">{athlete.clubName}</span>
            </div>
          )}
          {athlete.coachName && (
            <div className="flex items-center gap-1.5 text-telemetry-text-secondary">
              <span className="text-telemetry-text-muted">Treinador:</span>
              <span>{athlete.coachName}</span>
            </div>
          )}
          {!athlete.clubName && !athlete.coachName && (
            <span className="text-telemetry-text-muted italic">Avulso / Sem vínculo</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-telemetry-surface border border-telemetry-border/30 text-telemetry-text-secondary">
          {technical}
        </div>
        {athlete.gender && (
          <div className="text-[11px] text-telemetry-text-muted mt-0.5 capitalize">
            {athlete.gender.toLowerCase()}{athlete.age ? ` · ${athlete.age} anos` : ''}
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-xs">
        <div className="text-telemetry-text-secondary font-medium">{location}</div>
        {rankings !== '-' && (
          <div className="text-[11px] text-telemetry-blue mt-0.5">{rankings}</div>
        )}
      </td>
    </tr>
  );
}
