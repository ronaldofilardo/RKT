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
      return 'text-telemetry-text-muted bg-telemetry-card';
    }

    if (isCurrent) {
      return 'text-telemetry-volt font-bold bg-telemetry-elevated';
    }

    const isComplete = set && isSetCompleted(set, tennisFormat, undefined, setsWon);
    if (!isComplete) {
      return 'text-telemetry-text-muted bg-telemetry-card';
    }

    const playerWon = player === 'player1' ? set.player1 > set.player2 : set.player2 > set.player1;

    if (playerWon) {
      return 'text-white font-bold bg-telemetry-blue';
    } else {
      return 'text-telemetry-text-muted bg-telemetry-elevated';
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
    ? 'bg-telemetry-alert text-telemetry-base'
    : 'bg-telemetry-card text-telemetry-text-primary';
  const nameBgP2 = isSuspended
    ? 'bg-telemetry-alert text-telemetry-base'
    : 'bg-telemetry-card text-telemetry-text-primary';

  return (
    <div className={`rounded-xl border overflow-hidden mx-4 sm:mx-auto max-w-md ${isSuspended ? 'border-telemetry-alert' : 'border-white/10 shadow-md bg-telemetry-card'}`}>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-[10px] text-telemetry-text-muted font-space-grotesk">
            <th scope="col" aria-label="Jogador" className="text-left py-0.5 px-2 w-[110px] sm:w-[120px] bg-telemetry-elevated border-b border-white/10"></th>
            <th scope="col" aria-label="Vencedor" className="w-5 sm:w-6 bg-telemetry-elevated border-l border-b border-white/10"></th>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && isSetCompleted(set, tennisFormat, i, setsWon);

              return (
                <th key={i} scope="col" aria-label={`Set ${i + 1}`} className={`text-center px-1 py-0.5 w-8 sm:w-12 bg-telemetry-elevated border-l border-b border-white/10 ${isCurrent ? 'font-bold text-telemetry-volt' : ''}`}>
                  {isCurrent ? 'atual' : (isComplete ? i + 1 : '')}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr className="text-xs">
            <td title={player1.name} className={`text-left py-1 px-2 font-bold tracking-wide whitespace-nowrap truncate border-b border-white/10 ${nameBgP1}`}>
              {player1.name}
            </td>
            <td className="text-center py-1 bg-telemetry-card border-l border-b border-white/10">
              {winner === 'player1' && <span className="text-telemetry-volt font-bold text-sm">✓</span>}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const style = getSetCellStyle(set, i, 'player1', isCurrent);

              return (
                <td
                  key={i}
                  className={`text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-b border-white/10 ${style}`}
                >
                  {renderSetScore(set, 'player1')}
                </td>
              );
            })}
          </tr>

          <tr className="text-xs">
            <td title={player2.name} className={`text-left py-1 px-2 font-bold tracking-wide whitespace-nowrap truncate ${nameBgP2}`}>
              {player2.name}
            </td>
            <td className="text-center py-1 bg-telemetry-card border-l border-white/10">
              {winner === 'player2' && <span className="text-telemetry-volt font-bold text-sm">✓</span>}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const style = getSetCellStyle(set, i, 'player2', isCurrent);

              return (
                <td
                  key={i}
                  className={`text-center px-1 py-1 text-sm font-space-grotesk font-semibold border-l border-white/10 ${style}`}
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
