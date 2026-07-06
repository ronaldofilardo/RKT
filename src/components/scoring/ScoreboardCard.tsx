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

  return (
    <div className={`rounded-xl border p-3 sm:p-4 mx-4 sm:mx-auto max-w-md ${isSuspended ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 shadow-sm'}`}>
      <table className="w-full">
        <thead>
          <tr className="text-[10px] text-gray-500 font-mono">
            <th className="text-left py-1 pr-4 w-[90px] sm:w-[110px]"></th>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && (set.player1 > set.player2 || set.player2 > set.player1);
              
              return (
                <th key={i} className={`text-center px-2 py-1 w-8 sm:w-10 ${isCurrent ? 'font-bold text-gray-700' : ''}`}>
                  {isCurrent ? 'atual' : (isComplete ? i + 1 : '')}
                </th>
              );
            })}
            <th className="text-right px-2 py-1 font-semibold text-[10px] w-[32px]"></th>
          </tr>
        </thead>
        <tbody>
          {/* Player 1 */}
          <tr className="text-xs">
            <td className={`text-left py-2 pr-4 font-semibold ${isSuspended ? 'text-amber-900' : 'text-gray-900'}`}>
              {player1.name}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && (set.player1 > set.player2 || set.player2 > set.player1);
              
              return (
                <td
                  key={i}
                  className={`text-center px-2 py-2 text-sm font-mono ${
                    isCurrent
                      ? isSuspended ? 'text-amber-700 font-bold' : 'text-gray-900 font-bold'
                      : isComplete
                        ? isSuspended ? 'text-amber-600' : 'text-gray-700'
                        : 'text-gray-300'
                  }`}
                >
                  {set ? set.player1 : '-'}
                </td>
              );
            })}
            <td className="text-right px-2 py-2"></td>
          </tr>

          {/* Player 2 */}
          <tr className="text-xs">
            <td className={`text-left py-2 pr-4 font-semibold ${isSuspended ? 'text-amber-900' : 'text-gray-900'}`}>
              {player2.name}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && (set.player1 > set.player2 || set.player2 > set.player1);
              
              return (
                <td
                  key={i}
                  className={`text-center px-2 py-2 text-sm font-mono ${
                    isCurrent
                      ? isSuspended ? 'text-amber-700 font-bold' : 'text-gray-900 font-bold'
                      : isComplete
                        ? isSuspended ? 'text-amber-600' : 'text-gray-700'
                        : 'text-gray-300'
                  }`}
                >
                  {set ? set.player2 : '-'}
                </td>
              );
            })}
            <td className="text-right px-2 py-2"></td>
          </tr>
        </tbody>
        <tfoot>
          {/* Sets won summary */}
          <tr className="text-[9px] border-t border-gray-200 mt-1">
            <td className="text-left py-2 pr-4 text-gray-400">Sets</td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && (set.player1 > set.player2 || set.player2 > set.player1);
              const p1Won = set && set.player1 > set.player2;
              const p2Won = set && set.player2 > set.player1;
              
              return (
                <td key={i} className="text-center px-2 py-2">
                  {isCurrent ? (
                    <span className="text-gray-300">-</span>
                  ) : isComplete ? (
                    p1Won ? (
                      <span className="text-sky-600 font-bold">✓</span>
                    ) : p2Won ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )
                  ) : (
                    <span className="text-gray-200">-</span>
                  )}
                </td>
              );
            })}
            <td className="text-right px-2 py-2 text-gray-400 font-mono text-[10px]">
              {getSetsWon('player1')}-{getSetsWon('player2')}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}