import type { NormalizedScoreState } from '@/core/scoring/score-normalizer';
import type { TennisFormat } from '@/lib/matchConfig';
import { ScoreboardHeader, ScoreboardPlayerRow, ScoreboardSummary } from './ScoreboardCard.rows';

type ScoreSet = NormalizedScoreState['sets'][number];
type Player = 'player1' | 'player2';
type Props = { player1: { id: string; name: string }; player2: { id: string; name: string }; isSuspended?: boolean; tennisFormat?: TennisFormat; sets: ScoreSet[]; currentSetIndex: number; numSets: number; getSetsWon: (player: Player) => number; getSetCellStyle: (set: ScoreSet | undefined, index: number, player: Player, current: boolean) => string; };

export function ScoreboardCardView({ player1, player2, isSuspended, tennisFormat, sets, currentSetIndex, numSets, getSetsWon, getSetCellStyle }: Props) {
  return <div className={`rounded-xl border p-3 sm:p-4 mx-4 sm:mx-auto max-w-md ${isSuspended ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-white border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700'}`}><table className="w-full table-fixed"><ScoreboardHeader sets={sets} numSets={numSets} currentSetIndex={currentSetIndex} tennisFormat={tennisFormat} /><tbody><ScoreboardPlayerRow player={player1} playerKey="player1" sets={sets} numSets={numSets} currentSetIndex={currentSetIndex} isSuspended={isSuspended} style={getSetCellStyle} /><ScoreboardPlayerRow player={player2} playerKey="player2" sets={sets} numSets={numSets} currentSetIndex={currentSetIndex} isSuspended={isSuspended} style={getSetCellStyle} /></tbody><ScoreboardSummary sets={sets} numSets={numSets} currentSetIndex={currentSetIndex} tennisFormat={tennisFormat} getSetsWon={getSetsWon} /></table></div>;
}
