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
  ctId?: string | null;
  isServerP1: boolean;
  isServerP2: boolean;
  isLiveOrSuspended: boolean;
  currentGame: { player1?: number | string; player2?: number | string; advantage?: 'player1' | 'player2' | null } | null;
  isCurrentSetMT: boolean;
  lastSetTiebreakScore: { player1: number; player2: number } | null;
  currentSetIndex: number;
}

const clubBadge = (club?: string | null, ctId?: string | null, createdByName?: string | null) => {
  const isOwn = Boolean(club && ctId && club === ctId);
  const ownerLabel = ctId ? 'Meu clube' : 'Meu atleta';
  const otherLabel = 'Outros';
  return (
    <span
      className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-semibold border border-white/20 bg-white/10"
      title={isOwn ? ownerLabel : club ? `${otherLabel} (clube: ${club})` : createdByName ? `Criado por ${createdByName}` : 'Sem clube'}
    >
      {isOwn ? ownerLabel : club ? otherLabel : createdByName ? `Criado por ${createdByName}` : 'Sem clube'}
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
  ctId,
  isServerP1,
  isServerP2,
  isLiveOrSuspended,
  currentGame,
  isCurrentSetMT,
  lastSetTiebreakScore,
  currentSetIndex,
}: MatchCardScoreTableProps) {
  const headerClasses = 'text-center px-1 py-0.5 bg-telemetry-elevated border border-white/10 text-[10px] font-space-grotesk';
  const pontuacaoClasses = 'w-10 sm:w-14 border border-white/10';
  const cellClasses = 'text-center px-1 py-1 text-sm font-space-grotesk font-semibold border border-white/10';

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
    <div className="px-4 pb-3">
      <div className="rounded-md overflow-hidden border border-white/10">
        <table className="w-full table-fixed border-collapse border-0">
          <thead>
            <tr className="text-[10px] font-space-grotesk">
              <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-2 w-[110px] sm:w-[120px] bg-telemetry-elevated border border-white/10"></th>
              <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border border-white/10"></th>
              {columnTitles.map((title, i) => {
                const isCurrentHeader = isLiveOrSuspended && i === currentSetIndex;
                return (
                  <th
                    key={i}
                    scope="col"
                    aria-label={title}
                    className={`${headerClasses} ${isCurrentHeader ? 'font-bold text-telemetry-volt' : 'text-telemetry-text-muted'}`}
                  >
                    {title}
                  </th>
                );
              })}
              {isLiveOrSuspended && (
                <th scope="col" aria-label="Pontos" className={`${headerClasses} ${pontuacaoClasses} font-bold text-telemetry-volt`}>
                  Pontos
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs">
              <td
                title={p1Name}
                className={`text-left py-1 px-2 font-bold tracking-wide truncate max-w-full border border-white/10 bg-telemetry-card text-telemetry-text-primary`}
              >
                <span className="flex items-center gap-1.5">
                  {p1Name}
                  {clubBadge(p1Club, ctId, p1CreatedBy)}
                </span>
              </td>
              <td className={`text-center py-1 bg-telemetry-card border border-white/10 text-xs`}>
                {isServerP1 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
              </td>
              {displayedSets.map((set, i) => {
                const isCurrent = isLiveOrSuspended && i === currentSetIndex;
                const style = isCurrent
                  ? 'text-telemetry-volt font-bold bg-telemetry-card'
                  : 'text-telemetry-text-muted bg-telemetry-card';
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
                <td className={`${cellClasses} bg-telemetry-card text-telemetry-volt font-bold`}>
                  {pontosP1}
                </td>
              )}
            </tr>
            <tr className="text-xs">
              <td
                title={p2Name}
                className={`text-left py-1 px-2 font-bold tracking-wide truncate max-w-full border border-white/10 bg-telemetry-card text-telemetry-text-primary`}
              >
                <span className="flex items-center gap-1.5">
                  {p2Name}
                  {clubBadge(p2Club, ctId, p2CreatedBy)}
                </span>
              </td>
              <td className={`text-center py-1 bg-telemetry-card border border-white/10 text-xs`}>
                {isServerP2 ? <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span> : null}
              </td>
              {displayedSets.map((set, i) => {
                const isCurrent = isLiveOrSuspended && i === currentSetIndex;
                const style = isCurrent
                  ? 'text-telemetry-volt font-bold bg-telemetry-card'
                  : 'text-telemetry-text-muted bg-telemetry-card';
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
                <td className={`${cellClasses} bg-telemetry-card text-telemetry-volt font-bold`}>
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
