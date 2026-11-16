/**
 * CHARACTERIZATION TESTS — edit-score-state.ts (Complete)
 *
 * Propósito: Capturar comportamento OBSERVADO completo da lógica de edição de placar
 * Data: 2026-08-18
 * Owner: @qa
 *
 * Comportamentos suspeitos (resolvidos):
 * - TD-046: isMatchTiebreakSetUtil importado de use-session-manager.logic (canônico) — sem duplicação
 * - calculateValidation usa isMatchTiebreakSetUtil apenas quando setResults fornecido (design correto)
 * - calculateMatchState delega detecção de MT para calculateValidation (sem reimplementação)
 * - createSetEditData usa lógica condicional clara: tiebreakScore vs currentGamePoints
 * - shouldAutoAddSet recebe isPotentialMTSet via matchState (testes validam)
 * - createSetEditData tem 10 params (REFACTOR_QUEUE item 9 — refactor pendente, não bug)
 *
 * Kit compartilhado pelas suítes edit-score-state.characterization.*.test.ts e
 * edit-score-state.*.test.ts — divisões de edit-score-state.characterization.test.ts
 * (786L/72 its) e edit-score-state.test.ts (645L/63 its).
 * Fora da coleta do Jest (não termina em .test.ts).
 */
import {
  calculateValidation,
  calculateMatchState,
  type EditScoreValidationInput,
  type EditScoreMatchStateInput,
  type CreateSetEditDataInput,
  type ShouldAutoAddSetInput,
  type CalculateNextServerInput,
  type CompletedSet,
  type EditScoreValidation,
  type EditScoreMatchState,
} from '@/core/scoring/edit-score-state';
import type { SetEditData } from '@/core/scoring/edit-score-domain';

/** baseInput original de calculateValidation (characterization L154). */
export const baseValidationInput: EditScoreValidationInput = {
  p1Input: '',
  p2Input: '',
  matchFormat: 'BEST_OF_3',
  totalEditedSets: 0,
};

/** calculateValidation com o spread do baseInput original (mesma entrada). */
export function validate(overrides: Partial<EditScoreValidationInput> = {}) {
  return calculateValidation({ ...baseValidationInput, ...overrides });
}

/** Fixtures de setResults idênticas aos originais (2-2, 3-1, 1-3, parcial). */
export const SET_RESULTS_2_2: SetEditData[] = [
  { p1Games: 6, p2Games: 4, isPartial: false },
  { p1Games: 3, p2Games: 6, isPartial: false },
  { p1Games: 6, p2Games: 4, isPartial: false },
  { p1Games: 4, p2Games: 6, isPartial: false },
];

export const SET_RESULTS_3_1: SetEditData[] = [
  { p1Games: 6, p2Games: 4, isPartial: false },
  { p1Games: 6, p2Games: 3, isPartial: false },
  { p1Games: 6, p2Games: 4, isPartial: false },
  { p1Games: 4, p2Games: 6, isPartial: false },
];

export const SET_RESULTS_1_3: SetEditData[] = [
  { p1Games: 6, p2Games: 4, isPartial: false },
  { p1Games: 3, p2Games: 6, isPartial: false },
  { p1Games: 4, p2Games: 6, isPartial: false },
  { p1Games: 3, p2Games: 6, isPartial: false },
];

export const SET_RESULTS_PARTIAL: SetEditData[] = [
  { p1Games: 6, p2Games: 4, isPartial: false },
  { p1Games: 3, p2Games: 6, isPartial: false },
  { p1Games: 4, p2Games: 3, isPartial: true }, // parcial
  { p1Games: 4, p2Games: 6, isPartial: false },
];

/** newSets fixtures dos testes de calculateMatchState (2 sets / 1 set com TB). */
export const NEW_SETS_1_1: SetEditData[] = [
  { p1Games: 6, p2Games: 4, isPartial: false },
  { p1Games: 4, p2Games: 6, isPartial: false },
];

export const NEW_SETS_TB: SetEditData[] = [
  { p1Games: 10, p2Games: 8, isPartial: false, tiebreakScore: { player1: 10, player2: 8 } },
];

/** completedSets fixtures (mesmos placares/vencedores dos originais). */
export const COMPLETED_1_1: CompletedSet[] = [
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
  { games: { player1: 3, player2: 6 }, winner: 'player2' },
];

export const COMPLETED_2_P1: CompletedSet[] = [
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
  { games: { player1: 6, player2: 3 }, winner: 'player1' },
];

export const COMPLETED_1_P1: CompletedSet[] = [
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
];

export const COMPLETED_BO5: CompletedSet[] = [
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
  { games: { player1: 3, player2: 6 }, winner: 'player2' },
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
  { games: { player1: 4, player2: 6 }, winner: 'player2' },
];

export const COMPLETED_BO5_3_1: CompletedSet[] = [
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
  { games: { player1: 6, player2: 3 }, winner: 'player1' },
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
  { games: { player1: 4, player2: 6 }, winner: 'player2' },
];

/** validation 6-4 do baseInput original de calculateMatchState (characterization L439). */
export const VALIDATION_6_4: EditScoreValidation = {
  bothFilled: true,
  p1Val: 6,
  p2Val: 4,
  setValidation: { isValid: true, winner: 'player1', isPartial: false },
  hasWinner: true,
  completed: true,
  isSetTrulyCompleted: true,
  setValidationError: undefined,
  hasTiebreak: false,
  isMatchTiebreakSet: false,
  isPotentialMTSet: false,
};

/** baseInput original de calculateMatchState (characterization L435). */
export const baseMatchStateInput: EditScoreMatchStateInput = {
  matchFormat: 'BEST_OF_3',
  completedSets: [],
  newSets: [],
  validation: VALIDATION_6_4,
};

/** calculateMatchState com o spread do baseInput original (mesma entrada). */
export function matchState(overrides: Partial<EditScoreMatchStateInput> = {}) {
  return calculateMatchState({ ...baseMatchStateInput, ...overrides });
}

/** baseInput original de createSetEditData (characterization L605). */
export const baseSetEditDataInput: CreateSetEditDataInput = {
  p1Val: 6,
  p2Val: 4,
  isSetTrulyCompleted: true,
  hasTiebreak: false,
  tiebreakP1Num: 0,
  tiebreakP2Num: 0,
  isMatchTiebreakSet: false,
  isPotentialMTSet: false,
  p1Points: '0',
  p2Points: '0',
  currentSets: { player1: 0, player2: 0 },
};

/** validation do baseInput original de shouldAutoAddSet (characterization L678). */
export const AUTO_ADD_VALIDATION: EditScoreValidation = {
  bothFilled: true,
  p1Val: 6,
  p2Val: 4,
  setValidation: { isValid: true, winner: 'player1' },
  hasWinner: true,
  completed: true,
  isSetTrulyCompleted: true,
  setValidationError: undefined,
  hasTiebreak: false,
  isMatchTiebreakSet: false,
  isPotentialMTSet: false,
};

/** matchState do baseInput original de shouldAutoAddSet (characterization L691). */
export const AUTO_ADD_MATCH_STATE: EditScoreMatchState = {
  p1SetsWonFromProp: 0,
  p2SetsWonFromProp: 0,
  newP1SetsWon: 0,
  newP2SetsWon: 0,
  p1SetsWon: 1,
  p2SetsWon: 0,
  matchAlreadyOver: false,
  matchWouldEnd: false,
  totalEditedSets: 0,
  isMatchTiebreakSet: false,
  isPotentialMTSet: false,
  maxSets: 3,
  setsToWin: 2,
};

/** baseInput original de shouldAutoAddSet (characterization L677). */
export const baseAutoAddInput: ShouldAutoAddSetInput = {
  validation: AUTO_ADD_VALIDATION,
  matchState: AUTO_ADD_MATCH_STATE,
  currentSets: { player1: 0, player2: 0 },
  p1Val: 6,
  p2Val: 4,
};

/** baseInput original de calculateNextServer (characterization L742). */
export const baseNextServerInput: CalculateNextServerInput = {
  currentServer: 'player1',
  p1Games: 6,
  p2Games: 4,
  matchFormat: 'BEST_OF_3',
  tiebreakScore: null,
  completedSets: [],
};
