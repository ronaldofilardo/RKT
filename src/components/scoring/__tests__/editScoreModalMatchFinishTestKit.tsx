/**
 * CHARACTERIZATION — EditScoreModal (detecção de partida encerrada / matchFinish).
 * Kit compartilhado pelas suítes EditScoreModal.matchFinish.*.test.tsx — divisão
 * da suíte original EditScoreModal.matchFinish.test.tsx (387L/9 its).
 * Fora da coleta do Jest (não termina em .test.tsx).
 */
import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { EditScoreModal } from '../EditScoreModal';

type ModalProps = ComponentProps<typeof EditScoreModal>;
type CompletedSets = Array<{ games: Record<'player1' | 'player2', number>; winner: 'player1' | 'player2' }>;

/** defaultProps idênticos ao original (describe raiz de matchFinish.test.tsx). */
export const defaultProps: ModalProps = {
  isOpen: true,
  matchFormat: 'BEST_OF_3',
  playerNames: { p1: 'Play1', p2: 'Play2' },
  currentSets: { player1: 0, player2: 0 },
  currentServer: 'player1',
  completedSets: [],
  currentGamePoints: { player1: 0, player2: 0 },
  floorCurrentSets: null,
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
  onMatchFinished: jest.fn(),
};

/** Render do modal com defaultProps + overrides (idêntico ao spread do original). */
export function renderMatchFinishModal(overrides: Partial<ModalProps> = {}) {
  return render(<EditScoreModal {...defaultProps} {...overrides} />);
}

/** Set 1 já completado (Play2 venceu 1-6) — Testes 1 e 4. */
export const SET1_LOST_1_6: CompletedSets = [
  { games: { player1: 1, player2: 6 }, winner: 'player2' },
];

/** Sets 1-1 rumo ao Match Tiebreak (6-1 / 1-6) — Teste 2. */
export const TIED_1_1_MT: CompletedSets = [
  { games: { player1: 6, player2: 1 }, winner: 'player1' },
  { games: { player1: 1, player2: 6 }, winner: 'player2' },
];

/** Partida já encerrada 2-0 (1-6 / 3-6) — Teste 3. */
export const LOST_0_2: CompletedSets = [
  { games: { player1: 1, player2: 6 }, winner: 'player2' },
  { games: { player1: 3, player2: 6 }, winner: 'player2' },
];

/** Sets 1-1 para o 3º set (6-3 / 2-6) — Teste 5. */
export const TIED_1_1_THIRD: CompletedSets = [
  { games: { player1: 6, player2: 3 }, winner: 'player1' },
  { games: { player1: 2, player2: 6 }, winner: 'player2' },
];

/** Set 1 já completado (Play2 venceu 2-6) — Teste 4 (fluxo completo). */
export const SET1_LOST_2_6: CompletedSets = [
  { games: { player1: 2, player2: 6 }, winner: 'player2' },
];
