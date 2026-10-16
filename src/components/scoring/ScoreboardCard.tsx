'use client';
import { useMemo } from 'react';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import { isSetCompleted } from '@/app/match/[id]/scoring/scoringHelpers';
import { type TennisFormat } from '@/lib/matchConfig';
import type { ScoreboardSet, ScoreboardCardProps } from './scoreboard-card.types';
import {
  projectDisplayedSets,
  findCurrentSetIndex,
  getMaxSetsForFormat,
  getColumnTitles,
} from './scoreboard-card-logic';

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

  const displayedSets = useMemo<ScoreboardSet[]>(
    () => projectDisplayedSets(sets, tennisFormat, Boolean(scoreState?.isFinished)),
    [sets, tennisFormat, scoreState?.isFinished],
  );

  const currentSetIndex = useMemo(
    () => findCurrentSetIndex(sets, tennisFormat, setsWon, Boolean(scoreState?.isFinished)),
    [sets, tennisFormat, setsWon, scoreState?.isFinished],
  );

  const maxSetsForFormat = useMemo(() => getMaxSetsForFormat(tennisFormat), [tennisFormat]);

  const columnTitles = useMemo(
    () => getColumnTitles(tennisFormat, displayedSets.length, maxSetsForFormat),
    [tennisFormat, displayedSets.length, maxSetsForFormat],
  );

  const numSets = Math.max(displayedSets.length, columnTitles.length);

  const winner = scoreState?.winner as 'player1' | 'player2' | null | undefined;
  const currentServer = normalized?.server ?? scoreState?.server;
  const isServingP1 = !winner && (currentServer === 'player1' || currentServer === player1?.id);
  const isServingP2 = !winner && (currentServer === 'player2' || currentServer === player2?.id);

  const getSetCellStyle = (set: ScoreboardSet | undefined, _i: number, player: 'player1' | 'player2', isCurrent: boolean) => {
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

  const renderSetScore = (set: ScoreboardSet | undefined, player: 'player1' | 'player2') => {
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
          <tr className="text-xs">
            <td title={player1.name} className={`text-left py-1 px-2 font-bold tracking-wide whitespace-nowrap truncate border-b border-white/10 ${nameBgP1}`}>
              {player1.name}
            </td>
            <td className="text-center py-1 bg-telemetry-card border-l border-b border-white/10 text-xs">
              {winner === 'player1' ? (
                <span className="text-telemetry-volt font-bold text-sm">✓</span>
              ) : isServingP1 ? (
                <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span>
              ) : null}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = displayedSets[i];
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
            <td className="text-center py-1 bg-telemetry-card border-l border-white/10 text-xs">
              {winner === 'player2' ? (
                <span className="text-telemetry-volt font-bold text-sm">✓</span>
              ) : isServingP2 ? (
                <span title="Sacador" aria-label="Sacador" role="img" className="text-xs select-none">🎾</span>
              ) : null}
            </td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = displayedSets[i];
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
