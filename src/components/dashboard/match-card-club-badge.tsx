'use client';

interface ClubBadgeProps {
  club?: string | null;
  isOwnClub?: boolean;
  isOwnAthlete?: boolean;
  createdByName?: string | null;
}

/** Badge de clube/atleta próprio — usado nas linhas do MatchCard. */
export function ClubBadge({ club, isOwnClub, isOwnAthlete, createdByName }: ClubBadgeProps) {
  let label = 'Outros';
  let isHighlight = false;

  if (isOwnClub) {
    label = 'Meu Clube';
    isHighlight = true;
  } else if (isOwnAthlete) {
    label = 'Meu Atleta';
    isHighlight = true;
  } else if (club && club.trim() !== '') {
    label = club.trim();
  } else if (createdByName) {
    label = `Por: ${createdByName}`;
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold border ${
        isHighlight
          ? 'border-telemetry-border/30 bg-telemetry-elevated text-telemetry-text-primary'
          : 'border-telemetry-border/15 bg-telemetry-elevated/60 text-telemetry-text-muted'
      }`}
      title={label}
    >
      <span className="truncate max-w-[70px] sm:max-w-[105px]">{label}</span>
    </span>
  );
}