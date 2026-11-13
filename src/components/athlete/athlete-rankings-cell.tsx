import { formatRankings, type RankingEntryLike } from '@/lib/ranking/format-rankings';

interface AthleteRankingsCellProps {
  rankings?: Record<string, RankingEntryLike> | null;
}

export function AthleteRankingsCell({ rankings }: AthleteRankingsCellProps) {
  const rankingList = formatRankings(rankings);

  if (!rankingList) {
    return <span className="text-telemetry-text-muted/50 text-xs">-</span>;
  }

  return (
    <div className="flex max-w-[220px] flex-wrap gap-1">
      {rankingList.map((ranking) => (
        <span
          key={ranking}
          className="inline-flex items-center px-1.5 py-0.5 rounded bg-telemetry-volt/10 text-telemetry-volt text-[10px] font-medium border border-telemetry-volt/20"
        >
          {ranking}
        </span>
      ))}
    </div>
  );
}
