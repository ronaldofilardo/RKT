import { getPointDisplay, getSetDisplayScore, type ScoreDisplayProps } from './match-card-score.helpers';

export function ScoreDisplay({ scoreState, format, isSuspended }: ScoreDisplayProps) {
  const isMatchTiebreak = format === 'MATCH_TB_10' || format === 'BEST_OF_3_MATCH_TB';
  const textColor = isSuspended ? 'text-amber-700' : 'text-gray-900';
  if (!scoreState?.sets || scoreState.sets.length === 0) return <div className="grid grid-cols-[1.5rem_2.5rem] gap-x-1 text-[10px] text-gray-500"><span></span><span className="text-center">Pontos</span></div>;
  const renderSetScore = (player: 'player1' | 'player2') => scoreState.sets.map((set: any, index: number) => <span key={index} className={`text-sm flex items-center justify-center ${textColor}`}>{getSetDisplayScore(set, index, isMatchTiebreak, player)}</span>);
  return <div className="grid" style={{ gridTemplateColumns: `repeat(${scoreState.sets.length}, 1.5rem) 2.5rem`, gridTemplateRows: 'auto auto 2rem 2rem', rowGap: '0.125rem' }}><span className="text-[10px] text-gray-500 text-center" style={{ gridColumn: `1 / ${scoreState.sets.length + 1}` }}>Sets</span><span></span>{scoreState.sets.map((_: any, idx: number) => <span key={idx} className="text-[10px] text-gray-500 text-center">{idx + 1}</span>)}<span className="text-[10px] text-gray-500 text-center">Pontos</span>{renderSetScore('player1')}<span className={`text-sm flex items-center justify-center ${textColor}`}>{getPointDisplay(scoreState, isMatchTiebreak, 'player1')}</span>{renderSetScore('player2')}<span className={`text-sm flex items-center justify-center ${textColor}`}>{getPointDisplay(scoreState, isMatchTiebreak, 'player2')}</span></div>;
}
