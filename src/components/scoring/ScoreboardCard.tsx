'use client';
import type { ScoreboardCardProps } from './scoreboard-card.types';
import { useScoreboardCardData } from './use-scoreboard-card-data';
import { ScoreboardPlayerRow } from './scoreboard-player-row';
import { abbreviateDoublesName } from './doubles-name-abbreviation.logic';

export function ScoreboardCard({ player1, player2, player1Partner, player2Partner, scoreState, isSuspended, format, displayNames, gamePoints, className }: ScoreboardCardProps) {
  const {
    tennisFormat,
    setsWon,
    displayedSets,
    currentSetIndex,
    columnTitles,
    numSets,
    winner,
    isServingP1,
    isServingP2,
  } = useScoreboardCardData({
    scoreState,
    format,
    player1Id: player1?.id,
    player2Id: player2?.id,
  });

  const rowBase = { displayedSets, currentSetIndex, numSets, tennisFormat, setsWon, isSuspended };

  const p1DisplayName = displayNames?.player1 ?? abbreviateDoublesName(player1.name, player1Partner?.name ?? undefined);
  const p2DisplayName = displayNames?.player2 ?? abbreviateDoublesName(player2.name, player2Partner?.name ?? undefined);

  const gameCell = (value: string | undefined) =>
    gamePoints ? (
      <td className="text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-b border-white/10 text-telemetry-volt font-bold bg-telemetry-elevated">
        {value}
      </td>
    ) : undefined;

  return (
    <div className={`rounded-xl border overflow-hidden ${className ?? 'mx-4 sm:mx-auto max-w-md'} ${isSuspended ? 'border-telemetry-alert' : 'border-white/10 shadow-md bg-telemetry-card'}`}>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-[10px] font-space-grotesk">
            <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-2 w-[110px] sm:w-[120px] bg-telemetry-elevated border-b border-white/10"></th>
            <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border-l border-b border-white/10"></th>
            {Array.from({ length: numSets }).map((_, i) => {
              const title = columnTitles[i] ?? `Set ${i + 1}`;
              const isCurrent = i === currentSetIndex;

              return (
                <th
                  key={i}
                  scope="col"
                  aria-label={title}
                  className={`text-center px-1 py-0.5 w-8 sm:w-12 bg-telemetry-elevated border-l border-b border-white/10 ${
                    isCurrent ? 'font-bold text-telemetry-volt' : 'text-telemetry-text-muted'
                  }`}
                >
                  {title}
                </th>
              );
            })}
            {gamePoints && (
              <th
                scope="col"
                aria-label="Game em andamento"
                className="text-center px-1 py-0.5 w-10 sm:w-12 bg-telemetry-elevated border-l border-b border-white/10 font-bold text-telemetry-volt"
              >
                {gamePoints.title ?? 'Pts'}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          <ScoreboardPlayerRow
            {...rowBase}
            player={player1}
            partner={player1Partner ?? undefined}
            displayName={p1DisplayName}
            side="player1"
            isWinner={winner === 'player1'}
            isServing={isServingP1}
            trailingCell={gameCell(gamePoints?.player1)}
          />
          <ScoreboardPlayerRow
            {...rowBase}
            player={player2}
            partner={player2Partner ?? undefined}
            displayName={p2DisplayName}
            side="player2"
            isWinner={winner === 'player2'}
            isServing={isServingP2}
            isLastRow
            trailingCell={gameCell(gamePoints?.player2)}
          />
        </tbody>
      </table>
    </div>
  );
}
