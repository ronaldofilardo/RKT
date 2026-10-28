'use client';

import { isSetCompleted } from '@/app/match/[id]/scoring/scoring-domain';
import type { TennisFormat } from '@/lib/matchConfig';
import type { ScoreboardSet } from './scoreboard-card.types';

/** Classe da célula de set: vazia, atual, vencida ou em disputa. */
export function getSetCellStyle(
  set: ScoreboardSet | undefined,
  player: 'player1' | 'player2',
  isCurrent: boolean,
  tennisFormat: TennisFormat | undefined,
  setsWon: { player1: number; player2: number } | undefined
) {
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
}

/** Placar de um set: número simples ou número + superscript de tiebreak. */
export function renderSetScore(set: ScoreboardSet | undefined, player: 'player1' | 'player2') {
  if (!set) return '-';
  const score = set[player];
  const opponent = player === 'player1' ? 'player2' : 'player1';
  const opponentScore = set[opponent];

  if (set.tiebreakScore) {
    const tbScore = set.tiebreakScore[player];
    // Match Tiebreak: ambos os jogadores mostram só o placar do TB, sem sobrescrito.
    if (set.player1 <= 1 && set.player2 <= 1) {
      return tbScore;
    }
    // Set com tiebreak: vencedor mostra só os games; perdedor mostra games + pontos do TB em sobrescrito.
    const playerWon = score > opponentScore;
    if (playerWon) {
      return score;
    }
    return <span>{score}<sup className="text-[9px] leading-none opacity-80">{tbScore}</sup></span>;
  }
  return score;
}
