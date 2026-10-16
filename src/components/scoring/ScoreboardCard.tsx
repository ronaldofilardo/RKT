'use client';
import type { ScoreboardCardProps } from './scoreboard-card.types';
import { useScoreboardCardData } from './use-scoreboard-card-data';
import { ScoreboardPlayerRow } from './scoreboard-player-row';

export function ScoreboardCard({ player1, player2, scoreState, isSuspended, format }: ScoreboardCardProps) {
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

  return (
    <div className={`rounded-xl border overflow-hidden mx-4 sm:mx-auto max-w-md ${isSuspended ? 'border-telemetry-alert' : 'border-white/10 shadow-md bg-telemetry-card'}`}>
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
          </tr>
        </thead>
        <tbody>
          <ScoreboardPlayerRow
            {...rowBase}
            player={player1}
            side="player1"
            isWinner={winner === 'player1'}
            isServing={isServingP1}
          />
          <ScoreboardPlayerRow
            {...rowBase}
            player={player2}
            side="player2"
            isWinner={winner === 'player2'}
            isServing={isServingP2}
            isLastRow
          />
        </tbody>
      </table>
    </div>
  );
}
