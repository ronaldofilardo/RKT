import { getSinglePointDisplay } from './match-card-utils';

import type { ReactNode } from 'react';
import type { NormalizedScoreState } from './match-card-utils';

type ScoreSet = NormalizedScoreState['sets'][number];
type ScoreMatch = { player1: { name: string }; player2: { name: string } };

function displayScore(set: ScoreSet, player: 'player1' | 'player2', isMatchTiebreak: boolean, index: number) {
  if (set.isTiebreak && set.tiebreakScore) return set.tiebreakScore[player];
  if (isMatchTiebreak && index === 0) return set[player] ?? 0;
  return set[player] ?? 0;
}

function ScoreCell({ value, suspended }: { value: ReactNode; suspended: boolean }) {
  return <span className={`text-sm flex items-center justify-center ${suspended ? 'text-amber-700' : 'text-gray-900'}`}>{value}</span>;
}

function SetHeaders({ count, includePoints }: { count: number; includePoints: boolean }) {
  return <><span className="text-[10px] text-gray-500 text-center" style={{ gridColumn: `1 / ${count + 1}` }}>Sets</span>{includePoints && <span />}{Array.from({ length: count }, (_, index) => <span key={`header-${index}`} className="text-[10px] text-gray-500 text-center">{index + 1}</span>)}{includePoints && <span className="text-[10px] text-gray-500 text-center">Pontos</span>}</>;
}

function SetRows({ sets, player, isMatchTiebreak, suspended }: { sets: ScoreSet[]; player: 'player1' | 'player2'; isMatchTiebreak: boolean; suspended: boolean }) {
  return <>{sets.map((set, index) => <ScoreCell key={`${player}-${index}`} value={displayScore(set, player, isMatchTiebreak, index)} suspended={suspended} />)}</>;
}

function CompletedSetsGrid({ sets, isMatchTiebreak, suspended }: { sets: ScoreSet[]; isMatchTiebreak: boolean; suspended: boolean }) {
  return <div className="grid" style={{ gridTemplateColumns: `repeat(${sets.length}, 1.5rem)`, gridTemplateRows: '1.5rem 2rem 2rem', rowGap: '0.125rem' }}><SetHeaders count={sets.length} includePoints={false} /><SetRows sets={sets} player="player1" isMatchTiebreak={isMatchTiebreak} suspended={suspended} /><SetRows sets={sets} player="player2" isMatchTiebreak={isMatchTiebreak} suspended={suspended} /></div>;
}

function ActiveSetsGrid({ scoreState, isCurrentSetMT, isMatchTiebreak, suspended }: { scoreState: NormalizedScoreState; isCurrentSetMT: boolean; isMatchTiebreak: boolean; suspended: boolean }) {
  const points = (player: 'player1' | 'player2') => isCurrentSetMT ? '-' : getSinglePointDisplay(scoreState.currentGame, player);
  return <div className="grid" style={{ gridTemplateColumns: `repeat(${scoreState.sets.length}, 1.5rem) 2.5rem`, gridTemplateRows: '1.5rem 2rem 2rem', rowGap: '0.125rem' }}><SetHeaders count={scoreState.sets.length} includePoints={true} /><SetRows sets={scoreState.sets} player="player1" isMatchTiebreak={isMatchTiebreak} suspended={suspended} /><ScoreCell value={points('player1')} suspended={suspended} /><SetRows sets={scoreState.sets} player="player2" isMatchTiebreak={isMatchTiebreak} suspended={suspended} /><ScoreCell value={points('player2')} suspended={suspended} /></div>;
}

function CurrentGameGrid({ currentGame, suspended }: { currentGame: NormalizedScoreState['currentGame']; suspended: boolean }) {
  return <div className="grid grid-cols-1 gap-y-1" style={{ gridTemplateRows: '1.5rem 2rem 2rem' }}><span className="text-[10px] text-gray-500 text-center">Pontos</span><span className={`text-sm flex items-center justify-end ${suspended ? 'text-amber-700' : 'text-gray-900'}`}>{getSinglePointDisplay(currentGame, 'player1')}</span><span className={`text-sm flex items-center justify-end ${suspended ? 'text-amber-700' : 'text-gray-900'}`}>{getSinglePointDisplay(currentGame, 'player2')}</span></div>;
}

function EmptyScoreGrid() {
  return <div className="grid grid-cols-[1.5rem_2.5rem] gap-x-1 text-[10px] text-gray-500"><span className="text-center">Pontos</span></div>;
}

export function ScoreDisplay({ scoreState, isFinished, isMatchTiebreak, isCurrentSetMT, suspended }: { scoreState: NormalizedScoreState | null; isFinished: boolean; isMatchTiebreak: boolean; isCurrentSetMT: boolean; suspended: boolean }) {
  if (scoreState?.sets?.length) return isFinished ? <CompletedSetsGrid sets={scoreState.sets} isMatchTiebreak={isMatchTiebreak} suspended={suspended} /> : <ActiveSetsGrid scoreState={scoreState} isCurrentSetMT={isCurrentSetMT} isMatchTiebreak={isMatchTiebreak} suspended={suspended} />;
  if (scoreState?.currentGame) return <CurrentGameGrid currentGame={scoreState.currentGame} suspended={suspended} />;
  return <EmptyScoreGrid />;
}

export function PlayerNames({ match, hasScore }: { match: ScoreMatch; hasScore: boolean }) {
  if (hasScore) return <div className="grid grid-rows-[1.5rem_2rem_2rem] text-sm"><div className="text-[10px] text-gray-500 font-mono" /><p className="font-semibold text-gray-900 truncate self-center">{match.player1.name}</p><p className="font-semibold text-gray-900 truncate self-center">{match.player2.name}</p></div>;
  return <div className="text-sm"><p className="font-semibold text-gray-900 truncate">{match.player1.name}</p><p className="font-semibold text-gray-900 truncate">{match.player2.name}</p></div>;
}
