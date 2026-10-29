import { renderSetScore } from "@/components/scoring/scoreboard-card-cells";

interface MatchCardScoreTableProps {
  displayedSets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  } | undefined>;
  columnTitles: string[];
  p1Name: string;
  p2Name: string;
  isServerP1: boolean;
  isServerP2: boolean;
  isLiveOrSuspended: boolean;
}

export function MatchCardScoreTable({
  displayedSets,
  columnTitles,
  p1Name,
  p2Name,
  isServerP1,
  isServerP2,
  isLiveOrSuspended,
}: MatchCardScoreTableProps) {
  return (
    <div className="px-4 pb-3">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-[10px] font-space-grotesk">
            <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-2 w-[110px] sm:w-[120px] bg-telemetry-elevated border-b border-white/10"></th>
            <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border-l border-b border-white/10"></th>
            {columnTitles.map((title, i) => (
              <th
                key={i}
                scope="col"
                aria-label={title}
                className={`text-center px-1 py-0.5 w-8 sm:w-12 bg-telemetry-elevated border-l border-b border-white/10 ${isLiveOrSuspended && i === 0 ? 'font-bold text-telemetry-volt' : 'text-telemetry-text-muted'}`}
              >
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="text-xs">
            <td
              title={p1Name}
              className={`text-left py-1 px-2 font-bold tracking-wide truncate max-w-full border-b border-white/10 bg-telemetry-card text-telemetry-text-primary`}
            >
              {p1Name}
            </td>
            <td className={`text-center py-1 bg-telemetry-card border-l border-b border-white/10 text-xs`}>
              {isServerP1 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
            </td>
            {displayedSets.map((set, i) => {
              const style = i === 0 && isLiveOrSuspended
                ? 'text-telemetry-volt font-bold bg-telemetry-elevated'
                : 'text-telemetry-text-muted bg-telemetry-card';
              return (
                <td
                  key={i}
                  className={`text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-b border-white/10 ${style}`}
                >
                  {renderSetScore(set as { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null } | undefined, 'player1')}
                </td>
              );
            })}
          </tr>
          <tr className="text-xs">
            <td
              title={p2Name}
              className={`text-left py-1 px-2 font-bold tracking-wide truncate max-w-full border-b border-white/10 bg-telemetry-card text-telemetry-text-primary`}
            >
              {p2Name}
            </td>
            <td className={`text-center py-1 bg-telemetry-card border-l border-white/10 text-xs`}>
              {isServerP2 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
            </td>
            {displayedSets.map((set, i) => {
              const style = i === 0 && isLiveOrSuspended
                ? 'text-telemetry-volt font-bold bg-telemetry-elevated'
                : 'text-telemetry-text-muted bg-telemetry-card';
              return (
                <td
                  key={i}
                  className={`text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-b border-white/10 ${style}`}
                >
                  {renderSetScore(set as { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null } | undefined, 'player2')}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
