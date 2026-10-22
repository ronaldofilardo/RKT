import type { Player } from './edit-score-state';
import { SetsSummaryHeader } from './edit-score-summary-header';

interface SetsSummaryProps {
  title: string;
  sets: Array<{
    p1Games: number;
    p2Games: number;
    winner: Player | null;
  }>;
  playerNames: { p1: string; p2: string };
  startIndex?: number;
}

export function SetsSummary({ title, sets, playerNames, startIndex = 0 }: SetsSummaryProps) {
  if (sets.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-1.5 rounded-xl border border-white/10 bg-telemetry-elevated/40 p-3">
        <SetsSummaryHeader playerNames={playerNames} />

        {sets.map((set, idx) => {
          const isWinnerP1 = set.winner === 'player1';
          const isWinnerP2 = set.winner === 'player2';
          const p1CellClass = isWinnerP1
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP2
              ? 'bg-white/5 text-telemetry-text-muted'
              : 'text-telemetry-text-muted';
          const p2CellClass = isWinnerP2
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP1
              ? 'bg-white/5 text-telemetry-text-muted'
              : 'text-telemetry-text-muted';
          return (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm py-1"
            >
              <span className="text-telemetry-text-muted w-12 sm:w-14 font-medium text-xs">Set {startIndex + idx + 1}</span>
              <div className="flex-1 flex items-center justify-center gap-2">
                <span className={`w-16 sm:w-20 text-center font-space-grotesk font-semibold px-2 py-1 rounded-lg ${p1CellClass}`}>
                  {set.p1Games}
                </span>
                <span className="text-telemetry-text-muted text-xs w-3 text-center">×</span>
                <span className={`w-16 sm:w-20 text-center font-space-grotesk font-semibold px-2 py-1 rounded-lg ${p2CellClass}`}>
                  {set.p2Games}
                </span>
              </div>
              <span
                className={`w-20 sm:w-28 text-right text-xs font-semibold truncate ${isWinnerP1 ? 'text-telemetry-blue' : isWinnerP2 ? 'text-emerald-400' : 'text-telemetry-text-muted'}`}
                title={isWinnerP1 ? playerNames.p1 : isWinnerP2 ? playerNames.p2 : 'Em andamento'}
              >
                {isWinnerP1 ? playerNames.p1 : isWinnerP2 ? playerNames.p2 : 'Em andamento'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
