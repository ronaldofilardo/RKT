'use client';
import { useMemo } from 'react';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import { isSetCompleted } from '@/app/match/[id]/scoring/scoringHelpers';
import { getMatchFormatRules, type TennisFormat } from '@/lib/matchConfig';

interface Player {
  id: string;
  name: string;
}

interface ScoreboardCardProps {
  player1: Player;
  player2: Player;
  scoreState: any;
  isSuspended?: boolean;
  format?: string;
}

export function ScoreboardCard({ player1, player2, scoreState, isSuspended, format }: ScoreboardCardProps) {
  const tennisFormat = format as TennisFormat | undefined;

  const normalized = useMemo(
    () => normalizeScoreState(scoreState, tennisFormat),
    [scoreState, tennisFormat],
  );

  const sets = useMemo(
    () => normalized?.sets ?? scoreState?.sets ?? [],
    [normalized, scoreState],
  );
  const setsWon = normalized?.setsWon;
  const currentSetIndex = useMemo(() => {
    if (sets.length === 0) return 0;
    for (let i = sets.length - 1; i >= 0; i--) {
      if (!isSetCompleted(sets[i], tennisFormat, i, setsWon)) return i;
    }
    return -1;
  }, [sets, tennisFormat, setsWon]);

  const maxSetsForFormat = useMemo(() => {
    if (!tennisFormat) return 4;
    try {
      const rules = getMatchFormatRules(tennisFormat);
      return rules.setsToWin * 2 - 1;
    } catch {
      return 4;
    }
  }, [tennisFormat]);

  const numSets = Math.max(sets.length, maxSetsForFormat);

  const winner = scoreState?.winner as 'player1' | 'player2' | null | undefined;

  const getSetCellStyle = (set: any, _i: number, player: 'player1' | 'player2', isCurrent: boolean) => {
    if (!set) {
      return 'text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800';
    }

    if (isCurrent) {
      return 'text-white font-bold bg-emerald-600 dark:bg-emerald-500';
    }

    const isComplete = set && isSetCompleted(set, tennisFormat, undefined, setsWon);
    if (!isComplete) {
      return 'text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800';
    }

    const playerWon = player === 'player1' ? set.player1 > set.player2 : set.player2 > set.player1;

    if (playerWon) {
      return 'text-white font-bold bg-violet-600 dark:bg-violet-500';
    } else {
      return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const renderSetScore = (set: any, player: 'player1' | 'player2') => {
    if (!set) return '-';
    const score = set[player];
    if (set.tiebreakScore) {
      const tbScore = set.tiebreakScore[player];
      if (set.player1 <= 1 && set.player2 <= 1) {
        return tbScore;
      }
      return <span>{score}<sup className="text-[9px] leading-none opacity-80">{tbScore}</sup></span>;
    }
    return score;
  };

  const nameBgP1 = isSuspended
    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
    : 'bg-emerald-700 text-white dark:bg-emerald-800';
  const nameBgP2 = isSuspended
    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
    : 'bg-emerald-800 text-white dark:bg-emerald-900';

  return (
    <div className={`rounded-xl border overflow-hidden mx-4 sm:mx-auto max-w-md ${isSuspended ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700 shadow-md'}`}>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
            <th scope="col" aria-label="Jogador" className="text-left py-1.5 px-3 w-[80px] sm:w-[100px] bg-gray-50 dark:bg-gray-900"></th>
            <th scope="col" aria-label="Vencedor" className="w-6 bg-gray-50 dark:bg-gray-900 border-l border-white dark:border-gray-800"></th>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && isSetCompleted(set, tennisFormat, i, setsWon);

              return (
                <th key={i} scope="col" aria-label={`Set ${i + 1}`} className={`text-center px-1 py-1.5 w-10 sm:w-12 bg-gray-50 dark:bg-gray-900 border-l border-white dark:border-gray-800 ${isCurrent ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {isCurrent ? 'atual' : (isComplete ? i + 1 : '')}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr className="text-xs">
            <td className={`text-left py-2.5 px-3 font-bold tracking-wide ${nameBgP1}`}>
              {player1.name}
            </td>
            <td className="text-center py-2.5 bg-gray-50 dark:bg-gray-900 border-l border-white dark:border-gray-800">
              {winner === 'player1' && <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">✓</span>}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const style = getSetCellStyle(set, i, 'player1', isCurrent);

              return (
                <td
                  key={i}
                  className={`text-center px-1 py-2.5 text-sm font-mono font-semibold border-l border-white dark:border-gray-800 ${style}`}
                >
                  {renderSetScore(set, 'player1')}
                </td>
              );
            })}
          </tr>

          <tr className="text-xs">
            <td className={`text-left py-2.5 px-3 font-bold tracking-wide ${nameBgP2}`}>
              {player2.name}
            </td>
            <td className="text-center py-2.5 bg-gray-50 dark:bg-gray-900 border-l border-white dark:border-gray-800">
              {winner === 'player2' && <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">✓</span>}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const style = getSetCellStyle(set, i, 'player2', isCurrent);

              return (
                <td
                  key={i}
                  className={`text-center px-1 py-2.5 text-sm font-mono font-semibold border-l border-white dark:border-gray-800 ${style}`}
                >
                  {renderSetScore(set, 'player2')}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
