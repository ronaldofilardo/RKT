'use client';

interface Player {
  id: string;
  name: string;
}

interface ScoreboardCardProps {
  player1: Player;
  player2: Player;
  scoreState: any;
  isSuspended?: boolean;
}

export function ScoreboardCard({ player1, player2, scoreState, isSuspended }: ScoreboardCardProps) {
  const sets = scoreState?.sets ?? [];
  const currentSetIndex = sets.length > 0 ? sets.length - 1 : 0;

  const getSetsWon = (player: 'player1' | 'player2') => {
    return scoreState?.setsWon?.[player] ?? scoreState?.sets?.filter((s: any) => s[player] > s[player === 'player1' ? 'player2' : 'player1']).length ?? 0;
  };

  const numSets = Math.max(sets.length, 4);

  const getSetCellStyle = (set: any, i: number, player: 'player1' | 'player2', isCurrent: boolean) => {
    if (!set) {
      return 'text-gray-300 dark:text-gray-600 bg-transparent';
    }
    
    if (isCurrent) {
      return 'text-white font-bold bg-green-600 dark:bg-green-500';
    }
    
    const isComplete = set.player1 > set.player2 || set.player2 > set.player1;
    if (!isComplete) {
      return 'text-gray-300 dark:text-gray-600 bg-transparent';
    }
    
    const playerWon = player === 'player1' ? set.player1 > set.player2 : set.player2 > set.player1;
    
    if (playerWon) {
      return 'text-white font-bold bg-purple-700 dark:bg-purple-600';
    } else {
      return 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className={`rounded-xl border p-3 sm:p-4 mx-4 sm:mx-auto max-w-md ${isSuspended ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-white border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700'}`}>
      <table className="w-full table-fixed">
        <thead>
          <tr className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
            <th className="text-left py-1 pr-2 w-[80px] sm:w-[100px]"></th>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && (set.player1 > set.player2 || set.player2 > set.player1);
              
              return (
                <th key={i} className={`text-center px-1 py-1 w-7 sm:w-9 ${isCurrent ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                  {isCurrent ? 'atual' : (isComplete ? i + 1 : '')}
                </th>
              );
            })}
            <th className="text-right px-2 py-1 font-semibold text-[10px] w-[28px] sm:w-[32px]"></th>
          </tr>
        </thead>
        <tbody>
          {/* Player 1 */}
          <tr className="text-xs">
            <td className={`text-left py-2 pr-2 font-semibold ${isSuspended ? 'text-amber-900 dark:text-amber-200' : 'text-gray-900 dark:text-gray-100'}`}>
              {player1.name}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const style = getSetCellStyle(set, i, 'player1', isCurrent);
              
              return (
                <td
                  key={i}
                  className={`text-center px-1 py-2 text-sm font-mono rounded-sm ${style}`}
                >
                  {set ? (
                    set.isTiebreak && set.tiebreakScore ? (
                      // Match Tie-Break ou tie-break normal: mostrar pontos do tiebreak
                      set.tiebreakScore.player1
                    ) : (
                      // Set normal: mostrar games
                      set.player1
                    )
                  ) : '-'}
                </td>
              );
            })}
            <td className="text-right px-2 py-2"></td>
          </tr>

          {/* Player 2 */}
          <tr className="text-xs">
            <td className={`text-left py-2 pr-2 font-semibold ${isSuspended ? 'text-amber-900 dark:text-amber-200' : 'text-gray-900 dark:text-gray-100'}`}>
              {player2.name}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const style = getSetCellStyle(set, i, 'player2', isCurrent);
              
              return (
                <td
                  key={i}
                  className={`text-center px-1 py-2 text-sm font-mono rounded-sm ${style}`}
                >
                  {set ? (
                    set.isTiebreak && set.tiebreakScore ? (
                      // Match Tie-Break ou tie-break normal: mostrar pontos do tiebreak
                      set.tiebreakScore.player2
                    ) : (
                      // Set normal: mostrar games
                      set.player2
                    )
                  ) : '-'}
                </td>
              );
            })}
            <td className="text-right px-2 py-2"></td>
          </tr>
        </tbody>
        <tfoot>
          {/* Sets won summary */}
          <tr className="text-[9px] border-t border-gray-200 dark:border-gray-700 mt-1">
            <td className="text-left py-2 pr-2 text-gray-400 dark:text-gray-500">Sets</td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && (set.player1 > set.player2 || set.player2 > set.player1);
              const p1Won = set && set.player1 > set.player2;
              const p2Won = set && set.player2 > set.player1;
              
              return (
                <td key={i} className="text-center px-1 py-2">
                  {isCurrent ? (
                    <span className="text-gray-300 dark:text-gray-600">-</span>
                  ) : isComplete ? (
                    p1Won ? (
                      <span className="text-sky-600 dark:text-sky-400 font-bold">✓</span>
                    ) : p2Won ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">-</span>
                    )
                  ) : (
                    <span className="text-gray-200 dark:text-gray-700">-</span>
                  )}
                </td>
              );
            })}
            <td className="text-right px-2 py-2 text-gray-400 dark:text-gray-500 font-mono text-[10px]">
              {getSetsWon('player1')}-{getSetsWon('player2')}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}