import type { Player } from './edit-score-logic';

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
        {/* Cabeçalho claro de colunas dos jogadores */}
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-semibold text-telemetry-text-muted">
          <span className="w-12 sm:w-14">Set</span>
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="w-16 sm:w-20 text-center truncate text-telemetry-text-primary font-bold" title={playerNames.p1}>
              {playerNames.p1}
            </span>
            <span className="w-3 text-center opacity-30">×</span>
            <span className="w-16 sm:w-20 text-center truncate text-telemetry-text-primary font-bold" title={playerNames.p2}>
              {playerNames.p2}
            </span>
          </div>
          <span className="w-20 sm:w-28 text-right text-[11px] font-medium text-telemetry-text-muted">Vencedor</span>
        </div>

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
        {/* Cabeçalho claro de colunas dos jogadores */}
        <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-semibold text-telemetry-text-muted">
          <span className="w-12 sm:w-14">Set</span>
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="w-16 sm:w-20 text-center truncate text-telemetry-text-primary font-bold" title={playerNames.p1}>
              {playerNames.p1}
            </span>
            <span className="w-3 text-center opacity-30">×</span>
            <span className="w-16 sm:w-20 text-center truncate text-telemetry-text-primary font-bold" title={playerNames.p2}>
              {playerNames.p2}
            </span>
          </div>
          <span className="w-20 sm:w-28 text-right text-[11px] font-medium text-telemetry-text-muted">Vencedor</span>
        </div>

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

interface MatchSummaryProps {
  playerNames: { p1: string; p2: string };
  p1SetsWon: number;
  p2SetsWon: number;
  setsToWin: number;
}

export function MatchSummary({ playerNames, p1SetsWon, p2SetsWon, setsToWin }: MatchSummaryProps) {
  if (p1SetsWon === 0 && p2SetsWon === 0) return null;

  const matchEnded = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;
  const winner = p1SetsWon >= setsToWin ? playerNames.p1 : p2SetsWon >= setsToWin ? playerNames.p2 : null;

  return (
    <div className="space-y-2 pt-1 pb-1">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 rounded-xl bg-telemetry-elevated/40 border border-white/5">
        <span className="text-sm font-bold text-telemetry-text-primary text-center truncate" title={playerNames.p1}>
          {playerNames.p1}
        </span>
        <span className="text-base font-space-grotesk font-bold text-telemetry-volt px-2">
          {p1SetsWon} — {p2SetsWon}
        </span>
        <span className="text-sm font-bold text-telemetry-text-primary text-center truncate" title={playerNames.p2}>
          {playerNames.p2}
        </span>
      </div>
      {matchEnded ? (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-telemetry-volt/15 text-telemetry-volt border border-telemetry-volt/30">
            <span>🏆</span>
            <span>{winner} venceu a partida</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}