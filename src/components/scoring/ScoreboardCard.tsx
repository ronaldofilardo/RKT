'use client';
import { useMemo } from 'react';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import { ScoreboardCardView } from './ScoreboardCard.view';
import { isSetCompleted } from '@/app/match/[id]/scoring/scoringHelpers';
import { resolveSetsWon } from './ScoreboardCard.helpers';
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
  const currentSetIndex = useMemo(() => {
    if (sets.length === 0) return 0;
    // Procura o último set não-finalizado (em andamento).
    for (let i = sets.length - 1; i >= 0; i--) {
      if (!isSetCompleted(sets[i], tennisFormat)) return i;
    }
    // Todos finalizados: não há "atual" — retorna -1 para que nenhum
    // set seja destacado com o label 'atual'.
    return -1;
  }, [sets, tennisFormat]);

  const getSetsWon = (player: 'player1' | 'player2') => resolveSetsWon(normalized, scoreState, player);

  const numSets = Math.max(sets.length, 4);

  const getSetCellStyle = (set: any, _i: number, player: 'player1' | 'player2', isCurrent: boolean) => {
    if (!set) {
      return 'text-gray-300 dark:text-gray-600 bg-transparent';
    }
    
    if (isCurrent) {
      return 'text-white font-bold bg-green-600 dark:bg-green-500';
    }
    
    const isComplete = set && isSetCompleted(set, tennisFormat);
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

  return <ScoreboardCardView player1={player1} player2={player2} isSuspended={isSuspended} tennisFormat={tennisFormat} sets={sets} currentSetIndex={currentSetIndex} numSets={numSets} getSetsWon={getSetsWon} getSetCellStyle={getSetCellStyle} />;
}
