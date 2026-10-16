'use client';

import { useMemo } from 'react';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import { type TennisFormat } from '@/lib/matchConfig';
import type { ScoreboardSet, ScoreboardScoreState } from './scoreboard-card.types';
import {
  projectDisplayedSets,
  findCurrentSetIndex,
  getMaxSetsForFormat,
  getColumnTitles,
} from './scoreboard-card-logic';

interface UseScoreboardCardDataInput {
  scoreState?: ScoreboardScoreState | null;
  format?: string;
  player1Id?: string;
  player2Id?: string;
}

/** Derivações do ScoreboardCard: sets normalizados, colunas, set atual e sacadores. */
export function useScoreboardCardData({
  scoreState,
  format,
  player1Id,
  player2Id,
}: UseScoreboardCardDataInput) {
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
  const isServingP1 = !winner && (currentServer === 'player1' || currentServer === player1Id);
  const isServingP2 = !winner && (currentServer === 'player2' || currentServer === player2Id);

  return {
    tennisFormat,
    setsWon,
    displayedSets,
    currentSetIndex,
    columnTitles,
    numSets,
    winner,
    isServingP1,
    isServingP2,
  };
}
