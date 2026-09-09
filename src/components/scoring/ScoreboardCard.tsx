'use client';
import { useMemo } from 'react';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import { isSetCompleted } from '@/app/match/[id]/scoring/scoringHelpers';
import type { TennisFormat } from '@/lib/matchConfig';

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
  // Bug #4 (2026-08-07): saneia estado corrupto (MT gravado como games sem
  // tiebreakScore) antes de renderizar, para que sets de MT exibam os pontos
  // do tiebreak em vez de tratar pontos como games.
  const normalized = useMemo(
    () => normalizeScoreState(scoreState, tennisFormat),
    [scoreState, tennisFormat],
  );
  // Correção bug do "set atual" (2026-08-13): o critério anterior era
  // puramente posicional (`sets.length - 1`), assumindo a invariante
  // "último item do array = set em andamento" garantida pelo motor.
  // Porém estados vindos de `loadState`/edição manual / snapshot de banco
  // às vezes terminavam o array com um set finalizado (sem o próximo set
  // vazio) — e o ScoreboardCard destacava o set finalizado em verde como
  // "atual". Agora: o "set atual" é o último set NÃO-finalizado conforme
  // regras oficiais (`isSetCompleted`); se todos os sets estão finalizados
  // (partida acabou), não há "atual".
  const sets = useMemo(
    () => normalized?.sets ?? scoreState?.sets ?? [],
    [normalized, scoreState],
  );
  const setsWon = normalized?.setsWon;
  const currentSetIndex = useMemo(() => {
    if (sets.length === 0) return 0;
    // Procura o último set não-finalizado (em andamento).
    for (let i = sets.length - 1; i >= 0; i--) {
      if (!isSetCompleted(sets[i], tennisFormat, i, setsWon)) return i;
    }
    // Todos finalizados: não há "atual" — retorna -1 para que nenhum
    // set seja destacado com o label 'atual'.
    return -1;
  }, [sets, tennisFormat, setsWon]);

  const getSetsWon = (player: 'player1' | 'player2') => {
    return setsWon?.[player]
      ?? scoreState?.setsWon?.[player]
      ?? scoreState?.sets?.filter((s: any) => s[player] > s[player === 'player1' ? 'player2' : 'player1']).length
      ?? 0;
  };

  const numSets = Math.max(sets.length, 4);

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

  return (
    <div className={`rounded-xl border overflow-hidden mx-4 sm:mx-auto max-w-md ${isSuspended ? 'border-amber-300 dark:border-amber-700' : 'border-gray-200 dark:border-gray-700 shadow-md'}`}>
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
            <th scope="col" aria-label="Jogador" className="text-left py-1.5 px-3 w-[80px] sm:w-[100px] bg-gray-50 dark:bg-gray-900"></th>
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
            <th scope="col" aria-label="Sets vencidos" className="text-center px-2 py-1.5 font-semibold text-[10px] w-[32px] sm:w-[36px] bg-gray-50 dark:bg-gray-900 border-l border-white dark:border-gray-800"></th>
          </tr>
        </thead>
        <tbody>
          {/* Player 1 */}
          <tr className="text-xs">
            <td className={`text-left py-2.5 px-3 font-bold tracking-wide ${isSuspended ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-emerald-700 text-white dark:bg-emerald-800'}`}>
              {player1.name}
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
                     {set ? (
                       set.tiebreakScore ? (
                         set.player1 <= 1 && set.player2 <= 1 ? (
                           set.tiebreakScore.player1
                         ) : (
                           <span>{set.player1} <span className="opacity-70">[{set.tiebreakScore.player1}]</span></span>
                         )
                       ) : (
                         set.player1
                       )
                     ) : '-'}
                  </td>
               );
             })}
            <td className="text-center px-2 py-2.5 font-bold text-lg border-l border-white dark:border-gray-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
              {getSetsWon('player1')}
            </td>
          </tr>

          {/* Player 2 */}
          <tr className="text-xs">
            <td className={`text-left py-2.5 px-3 font-bold tracking-wide ${isSuspended ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-emerald-800 text-white dark:bg-emerald-900'}`}>
              {player2.name}
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
                     {set ? (
                       set.tiebreakScore ? (
                         set.player1 <= 1 && set.player2 <= 1 ? (
                           set.tiebreakScore.player2
                         ) : (
                           <span>{set.player2} <span className="opacity-70">[{set.tiebreakScore.player2}]</span></span>
                         )
                       ) : (
                         set.player2
                       )
                     ) : '-'}
                  </td>
               );
             })}
            <td className="text-center px-2 py-2.5 font-bold text-lg border-l border-white dark:border-gray-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
              {getSetsWon('player2')}
            </td>
          </tr>
        </tbody>
        <tfoot>
          {/* Sets won checkmarks */}
          <tr className="text-[9px] border-t border-gray-200 dark:border-gray-700">
            <td className="text-left py-1.5 px-3 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">Sets</td>
            {Array.from({ length: numSets }).map((_, i) => {
              const set = sets[i];
              const isCurrent = i === currentSetIndex;
              const isComplete = set && isSetCompleted(set, tennisFormat, i, setsWon);
              const p1Won = set && set.player1 > set.player2;
              const p2Won = set && set.player2 > set.player1;
              
              return (
                <td key={i} className="text-center px-1 py-1.5 bg-gray-50 dark:bg-gray-900 border-l border-white dark:border-gray-800">
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
            <td className="text-center px-2 py-1.5 text-gray-400 dark:text-gray-500 font-mono text-[10px] bg-gray-50 dark:bg-gray-900 border-l border-white dark:border-gray-800">
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}