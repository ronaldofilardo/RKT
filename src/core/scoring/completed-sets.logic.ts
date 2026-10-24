import type { ScoringState } from './types';
import type { TennisFormat } from '@/lib/matchConfig';
import { isSetCompleted } from './set-completed.logic';

export type SetWinner = 'player1' | 'player2';

export interface CompletedSetItem {
  setNumber: number;
  games: Record<SetWinner, number>;
  /** `null` enquanto o set não está concluído (ou em empate sem desempate). */
  winner: SetWinner | null;
  isCompleted: boolean;
  tiebreakScore?: { player1: number; player2: number };
}

export interface MatchCompletedSets {
  /** Quantidade de sets realmente concluídos segundo as regras do formato. */
  completedCount: number;
  /** Abas de set disponíveis no resumo: concluídos, ou ao menos 1 em andamento. */
  availableSetsCount: number;
  /** Todos os sets do `scoreState` (índice = setNumber - 1), inclusive o em andamento. */
  setsData: CompletedSetItem[];
}

type SetLike = Pick<ScoringState['sets'][number], 'player1' | 'player2' | 'tiebreakScore'>;

/** Vencedor pelo desempate (se houver diferença) ou pelos games; `null` em empate. */
export function deriveSetWinner(set: SetLike): SetWinner | null {
  const tb = set.tiebreakScore;
  if (tb && tb.player1 !== tb.player2) return tb.player1 > tb.player2 ? 'player1' : 'player2';
  if (set.player1 !== set.player2) return set.player1 > set.player2 ? 'player1' : 'player2';
  return null;
}

/**
 * Função canônica (scoring + dashboard) para "set concluído", "vencedor do
 * set" e "quantidade de abas". Usa as regras reais do formato.
 */
export function deriveMatchCompletedSets(
  scoreState: ScoringState | null | undefined,
  format?: string,
): MatchCompletedSets {
  const sets = scoreState?.sets ?? [];
  const setsData = sets.map((s, i): CompletedSetItem => {
    const isCompleted = isSetCompleted(s, format as TennisFormat | undefined, i, scoreState?.setsWon);
    return {
      setNumber: i + 1,
      games: { player1: s.player1 ?? 0, player2: s.player2 ?? 0 },
      winner: isCompleted ? deriveSetWinner(s) : null,
      isCompleted,
      ...(s.isTiebreak && s.tiebreakScore ? { tiebreakScore: s.tiebreakScore } : {}),
    };
  });
  const completedCount = setsData.filter((s) => s.isCompleted).length;
  return {
    completedCount,
    availableSetsCount: completedCount || Math.max(1, sets.length),
    setsData,
  };
}
