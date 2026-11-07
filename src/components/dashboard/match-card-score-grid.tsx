import { renderSetScore } from "@/components/scoring/scoreboard-card-cells";
import { getSinglePointDisplay } from "@/components/dashboard/match-card.logic";

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
  p1Club?: string | null;
  p2Club?: string | null;
  p1CreatedBy?: string | null;
  p2CreatedBy?: string | null;
  isP1OwnClub?: boolean;
  isP2OwnClub?: boolean;
  isP1OwnAthlete?: boolean;
  isP2OwnAthlete?: boolean;
  isWinnerP1?: boolean;
  isWinnerP2?: boolean;
  isFinished?: boolean;
  ctId?: string | null;
  isServerP1: boolean;
  isServerP2: boolean;
  isLiveOrSuspended: boolean;
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | null;
  isCurrentSetMT: boolean;
  lastSetTiebreakScore: { player1: number; player2: number } | null;
  currentSetIndex: number;
}

const clubBadge = (
  club?: string | null,
  isOwnClub?: boolean,
  isOwnAthlete?: boolean,
  createdByName?: string | null
) => {
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
};

export function MatchCardScoreTable({
  displayedSets,
  columnTitles,
  p1Name,
  p2Name,
  p1Club,
  p2Club,
  p1CreatedBy,
  p2CreatedBy,
  isP1OwnClub,
  isP2OwnClub,
  isP1OwnAthlete,
  isP2OwnAthlete,
  isWinnerP1,
  isWinnerP2,
  isFinished,
  ctId: _ctId,
  isServerP1,
  isServerP2,
  isLiveOrSuspended,
  currentGame,
  isCurrentSetMT,
  lastSetTiebreakScore,
  currentSetIndex,
}: MatchCardScoreTableProps) {
  const headerClasses = 'text-center px-0.5 sm:px-1 py-0.5 bg-telemetry-elevated border border-telemetry-border/10 text-[9px] sm:text-[10px] font-space-grotesk';
  // Colunas de sets compactas e responsivas: adaptam em telas menores para não cortar os nomes dos atletas/clubes.
  const setColClasses = 'w-7 sm:w-10 md:w-11';
  const pontuacaoClasses = 'w-9 sm:w-11 md:w-12 border border-telemetry-border/10';
  const cellClasses = 'text-center px-0.5 sm:px-1 py-1 text-xs sm:text-sm font-space-grotesk font-semibold border border-telemetry-border/10';

  const p1TextColor = isFinished
    ? (isWinnerP1 ? 'text-emerald-800 dark:text-telemetry-volt font-black' : isWinnerP2 ? 'text-telemetry-text-muted/70 font-normal' : 'text-telemetry-text-primary font-bold')
    : (isServerP1 ? 'text-emerald-800 dark:text-telemetry-volt font-black' : 'text-telemetry-text-primary font-bold');

  const p2TextColor = isFinished
    ? (isWinnerP2 ? 'text-emerald-800 dark:text-telemetry-volt font-black' : isWinnerP1 ? 'text-telemetry-text-muted/70 font-normal' : 'text-telemetry-text-primary font-bold')
    : (isServerP2 ? 'text-emerald-800 dark:text-telemetry-volt font-black' : 'text-telemetry-text-primary font-bold');

  const pontosP1 = isCurrentSetMT
    ? '-'
    : lastSetTiebreakScore
      ? String(lastSetTiebreakScore.player1 ?? 0)
      : getSinglePointDisplay(currentGame ?? undefined, 'player1');
  const pontosP2 = isCurrentSetMT
    ? '-'
    : lastSetTiebreakScore
      ? String(lastSetTiebreakScore.player2 ?? 0)
      : getSinglePointDisplay(currentGame ?? undefined, 'player2');

  return (
    <div className="px-3 sm:px-4 pb-3">
      <div className="rounded-md overflow-x-auto border border-telemetry-border/10 scrollbar-thin">
        <table className="w-full min-w-[270px] sm:min-w-full table-fixed border-collapse border-0">
          <thead>
            <tr className="text-[9px] sm:text-[10px] font-space-grotesk">
              <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-1.5 sm:px-2 bg-telemetry-elevated border border-telemetry-border/10"></th>
              <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border border-telemetry-border/10"></th>
              {columnTitles.map((title, i) => {
                const isCurrentHeader = isLiveOrSuspended && i === currentSetIndex;
                return (
                  <th
                    key={i}
                    scope="col"
                    aria-label={title}
                    className={`${headerClasses} ${setColClasses} ${isCurrentHeader ? 'font-bold text-telemetry-score-accent' : 'text-telemetry-score-secondary'}`}
                  >
                    {title}
                  </th>
                );
              })}
              {isLiveOrSuspended && (
                <th scope="col" aria-label="Pontos" className={`${headerClasses} ${pontuacaoClasses} font-bold text-telemetry-score-accent`}>
                  Pontos
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs">
              <td
                title={p1Name}
                className={`text-left py-1 px-1.5 sm:px-2 tracking-wide border border-telemetry-border/10 bg-telemetry-card ${p1TextColor}`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <span className="truncate" title={p1Name}>{p1Name}</span>
                  {clubBadge(p1Club, isP1OwnClub, isP1OwnAthlete, p1CreatedBy)}
                </div>
              </td>
              <td className="text-center py-1 bg-telemetry-card border border-telemetry-border/10 text-xs">
                {isServerP1 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
                {isFinished && isWinnerP1 ? (
                  <span title="Vencedor" aria-label="Vencedor" className="text-xs select-none filter dark:drop-shadow-[0_0_6px_rgba(204,255,0,0.7)]">
                    🏆
                  </span>
                ) : null}
              </td>
              {displayedSets.map((set, i) => {
                const isCurrent = isLiveOrSuspended && i === currentSetIndex;
                const style = isCurrent
                  ? 'text-telemetry-score-accent font-bold bg-telemetry-card'
                  : isFinished && isWinnerP1
                    ? 'text-emerald-800 dark:text-telemetry-volt font-black bg-telemetry-card'
                    : isFinished && isWinnerP2
                      ? 'text-telemetry-text-muted/70 bg-telemetry-card font-normal'
                      : 'text-telemetry-score-secondary bg-telemetry-card';
                return (
                  <td
                    key={i}
                    className={`${cellClasses} ${style}`}
                  >
                    {renderSetScore(set as { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null } | undefined, 'player1')}
                  </td>
                );
              })}
              {isLiveOrSuspended && (
                <td className={`${cellClasses} bg-telemetry-card text-telemetry-score-accent font-bold`}>
                  {pontosP1}
                </td>
              )}
            </tr>
            <tr className="text-xs">
              <td
                title={p2Name}
                className={`text-left py-1 px-1.5 sm:px-2 tracking-wide border border-telemetry-border/10 bg-telemetry-card ${p2TextColor}`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <span className="truncate" title={p2Name}>{p2Name}</span>
                  {clubBadge(p2Club, isP2OwnClub, isP2OwnAthlete, p2CreatedBy)}
                </div>
              </td>
              <td className="text-center py-1 bg-telemetry-card border border-telemetry-border/10 text-xs">
                {isServerP2 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
                {isFinished && isWinnerP2 ? (
                  <span title="Vencedor" aria-label="Vencedor" className="text-xs select-none filter dark:drop-shadow-[0_0_6px_rgba(204,255,0,0.7)]">
                    🏆
                  </span>
                ) : null}
              </td>
              {displayedSets.map((set, i) => {
                const isCurrent = isLiveOrSuspended && i === currentSetIndex;
                const style = isCurrent
                  ? 'text-telemetry-score-accent font-bold bg-telemetry-card'
                  : isFinished && isWinnerP2
                    ? 'text-emerald-800 dark:text-telemetry-volt font-black bg-telemetry-card'
                    : isFinished && isWinnerP1
                      ? 'text-telemetry-text-muted/70 bg-telemetry-card font-normal'
                      : 'text-telemetry-score-secondary bg-telemetry-card';
                return (
                  <td
                    key={i}
                    className={`${cellClasses} ${style}`}
                  >
                    {renderSetScore(set as { player1: number; player2: number; isTiebreak?: boolean; tiebreakScore?: { player1: number; player2: number } | null } | undefined, 'player2')}
                  </td>
                );
              })}
              {isLiveOrSuspended && (
                <td className={`${cellClasses} bg-telemetry-card text-telemetry-score-accent font-bold`}>
                  {pontosP2}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
