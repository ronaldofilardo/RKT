/**
 * Testes para as correções implementadas na conversa 2026-09-08:
 * 1. canConfirm: permitir confirmar ao retomar partida (0x0 com game points)
 * 2. isConfirming: estado de loading durante persistência
 * 3. Tiebreak floor: validação de pontos do tiebreak contra o floor
 * 4. Tiebreak initialGameRef: inicialização correta para tiebreak
 * 5. getFloorError: validação de floor para games
 *
 * Kit compartilhado pelas suítes EditScoreModal.conversation-fixes.*.test.ts.
 * Fora da coleta do Jest (não termina em .test.ts).
 */
import { calculateValidation } from '@/core/scoring/edit-score-state';
import type { SetEditData } from '@/core/scoring/edit-score-domain';

type CompletedSetGames = Array<{ games: { player1: number; player2: number } }>;

/**
 * Arrange dos testes de canConfirm resume (0x0) — estado e validação
 * idênticos ao original (Lógica extraída de use-edit-score-calculator.ts).
 */
export function resumeArrange(p1Points: string, p2Points: string, completedSets: CompletedSetGames = []) {
  const state = {
    p1Input: '0',
    p2Input: '0',
    newSets: [] as SetEditData[],
    p1Points,
    p2Points,
  };

  const validation = calculateValidation({
    p1Input: state.p1Input,
    p2Input: state.p2Input,
    matchFormat: 'BEST_OF_3',
    totalEditedSets: state.newSets.length + completedSets.length,
  });

  const bothFilled = validation.bothFilled;
  const scoresAreZero = bothFilled && validation.p1Val === 0 && validation.p2Val === 0;
  const hasGamePoints = state.p1Points !== '0' || state.p2Points !== '0';
  return { state, completedSets, bothFilled, scoresAreZero, hasGamePoints };
}

/** Floors dos testes: tiebreak 2x3 e games 4x3 (idênticos ao original). */
export const TIE_FLOOR = { player1: 2, player2: 3 };
export const GAME_FLOOR = { player1: 4, player2: 3 };

/**
 * Lógica extraída de useEditScoreModal.ts (initialGameRef) — idêntica ao original.
 * A condição de ramo (isTiebreak / !isTiebreak) era always-true nos testes
 * (constantes locais) e caiu aqui; a produção seta o ref incondicionalmente
 * quando há currentGamePoints (applyInitialGamePoints).
 */
export function initialGameRefFrom(
  currentGamePoints: { player1: number | string; player2: number | string } | null,
): { player1: string; player2: string } | null {
  let ref: { player1: string; player2: string } | null = null;
  if (currentGamePoints) {
    const p1 = typeof currentGamePoints.player1 === 'number'
      ? currentGamePoints.player1.toString()
      : currentGamePoints.player1;
    const p2 = typeof currentGamePoints.player2 === 'number'
      ? currentGamePoints.player2.toString()
      : currentGamePoints.player2;
    ref = { player1: p1, player2: p2 };
  }
  return ref;
}

/** Contexto fixo do original (set 6-6 / p1Val 6 / p2Val 6) + lógica de regressão do tiebreak. */
export function tiebreakRegression(
  initialGameRef: { player1: string; player2: string },
  tiebreakP1: string,
  tiebreakP2: string,
) {
  const currentSets = { player1: 6, player2: 6 };
  const p1Val = 6;
  const p2Val = 6;

  const sameSetScore = p1Val === currentSets.player1 && p2Val === currentSets.player2;
  const initialTbP1 = Number(initialGameRef.player1) || 0;
  const initialTbP2 = Number(initialGameRef.player2) || 0;
  const currentTbP1 = Number(tiebreakP1) || 0;
  const currentTbP2 = Number(tiebreakP2) || 0;

  const isRegression = sameSetScore && (
    (currentTbP1 < initialTbP1 && currentTbP2 <= initialTbP2) ||
    (currentTbP2 < initialTbP2 && currentTbP1 <= initialTbP1)
  );

  return { sameSetScore, isRegression };
}

/** Estado de loading dos testes de isConfirming (try/finally idêntico ao original). */
export function confirmingState() {
  let isConfirming = false;

  const confirmCurrentAction = async () => {
    isConfirming = true;
    try {
      // Simula onConfirm
      await new Promise((resolve) => setTimeout(resolve, 10));
    } finally {
      isConfirming = false;
    }
  };

  return {
    get isConfirming() {
      return isConfirming;
    },
    confirmCurrentAction,
  };
}

/** cancelCurrentAction extraído de useEditScoreModal.ts (idêntico ao original). */
export function cancelAction(isConfirming: boolean) {
  const onCancel = jest.fn();
  const cancelCurrentAction = () => {
    if (isConfirming) return;
    onCancel();
  };
  return { onCancel, cancelCurrentAction };
}

/** Fix do bug currentGamePoints: usa tiebreakScore quando isTiebreak (idêntico ao original). */
export function gamePointsFrom(
  effectiveScoreState: {
    currentGame?: { player1: number; player2: number };
    sets: Array<{
      player1: number;
      player2: number;
      isTiebreak: boolean;
      tiebreakScore?: { player1: number; player2: number };
    }>;
  },
  isTiebreak: boolean,
) {
  const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
  return {
    player1: isTiebreak
      ? (lastSet?.tiebreakScore?.player1 ?? 0)
      : (effectiveScoreState.currentGame?.player1 ?? 0),
    player2: isTiebreak
      ? (lastSet?.tiebreakScore?.player2 ?? 0)
      : (effectiveScoreState.currentGame?.player2 ?? 0),
  };
}
