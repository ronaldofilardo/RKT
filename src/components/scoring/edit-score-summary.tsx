import type { Player } from '@/core/scoring/edit-score-state';
import { SetsSummaryHeader } from './edit-score-summary-header';

export { SetsSummary } from './edit-score-sets-summary';
export { MatchSummary } from './edit-score-match-summary';

interface EditableSet {
  p1Games: number;
  p2Games: number;
  winner: Player | null;
  index: number;
  isPartial: boolean;
  hasValidationError?: boolean;
}

interface EditableSetsSummaryProps {
  title: string;
  sets: EditableSet[];
  playerNames: { p1: string; p2: string };
  startIndex?: number;
  onEditSet: (index: number, p1Games: number, p2Games: number) => void;
  validationErrors?: Record<number, string>;
}

export function EditableSetsSummary({ title, sets, playerNames, startIndex = 0, onEditSet, validationErrors }: EditableSetsSummaryProps) {
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
          const hasValidationError = Boolean(validationErrors?.[set.index]);
          const p1CellClass = isWinnerP1
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP2
              ? 'bg-telemetry-card text-telemetry-text-muted'
              : hasValidationError
                ? 'bg-telemetry-card border border-red-500 text-white'
                : 'bg-telemetry-card border border-white/10 text-white';
          const p2CellClass = isWinnerP2
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP1
              ? 'bg-telemetry-card text-telemetry-text-muted'
              : hasValidationError
                ? 'bg-telemetry-card border border-red-500 text-white'
                : 'bg-telemetry-card border border-white/10 text-white';
          return (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm py-1"
            >
              <span className="text-telemetry-text-muted w-12 sm:w-14 font-medium text-xs">Set {startIndex + idx + 1}</span>
              <div className="flex-1 flex items-center justify-center gap-2">
                <input
                  type="number"
                  value={set.p1Games}
                  onChange={(e) => onEditSet(set.index, parseInt(e.target.value, 10) || 0, set.p2Games)}
                  className={`w-16 sm:w-20 text-center rounded-lg px-2 py-1 text-sm font-space-grotesk font-semibold focus:outline-none focus:ring-2 focus:ring-telemetry-volt ${p1CellClass}`}
                  aria-label={`${playerNames.p1} Set ${startIndex + idx + 1}`}
                />
                <span className="text-telemetry-text-muted text-xs w-3 text-center">×</span>
                <input
                  type="number"
                  value={set.p2Games}
                  onChange={(e) => onEditSet(set.index, set.p1Games, parseInt(e.target.value, 10) || 0)}
                  className={`w-16 sm:w-20 text-center rounded-lg px-2 py-1 text-sm font-space-grotesk font-semibold focus:outline-none focus:ring-2 focus:ring-telemetry-volt ${p2CellClass}`}
                  aria-label={`${playerNames.p2} Set ${startIndex + idx + 1}`}
                />
              </div>
              <div className="w-20 sm:w-28 text-right flex items-center justify-end gap-1">
                <span
                  className={`text-xs font-semibold truncate ${isWinnerP1 ? 'text-telemetry-blue' : isWinnerP2 ? 'text-emerald-400' : 'text-telemetry-text-muted'}`}
                  title={isWinnerP1 ? playerNames.p1 : isWinnerP2 ? playerNames.p2 : 'Em andamento'}
                >
                  {isWinnerP1 ? playerNames.p1 : isWinnerP2 ? playerNames.p2 : 'Em andamento'}
                </span>
                {hasValidationError && <span className="text-xs text-red-400 font-bold" title={validationErrors?.[set.index]}>!</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
