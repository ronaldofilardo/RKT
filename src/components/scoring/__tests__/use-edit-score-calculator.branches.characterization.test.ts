/**
 * @jest-environment jsdom
 *
 * Characterization (R-15) — ramos de decisão de `useEditScoreCalculator`
 * que estavam sem cobertura antes de qualquer corte em S3.
 *
 * Cobertura anterior (medida com --coverage direcionado): 92,39% stmts /
 * 31,57% branch. Linhas alvo: 68-69, 75-76, 87-88, 102-103, 116-117,
 * 133-134, 136-139, 141-142, 153-154, 156-157, 214-215, 238, 322.
 *
 * IMPORTANTE (R-15): este arquivo registra o comportamento ATUAL. Qualquer
 * refatoração dos módulos `edit-score*` deve preservar estes resultados.
 *
 * Achado: a condição `validation.hasTiebreak && tiebreakRequired &&
 * !tiebreakValidation.hasValidTiebreak` (linha 74-76) é inalcançável por
 * construção — `isSetTrulyCompleted` (checado na linha 71) exige
 * `tiebreakComplete` quando `tiebreakRequired`, e `tiebreakComplete` só
 * é `true` quando `hasValidTiebreak` é `true` (ver
 * `resolveTiebreakStatus` em edit-score-validation.ts:131-133). Ramo
 * defensivo; não é possível cobri-lo com entradas reais.
 */
import { renderHook } from '@testing-library/react';
import { useEditScoreCalculator } from '../use-edit-score-calculator';
import type { CompletedSet, EditScoreState } from '../edit-score-logic';
import type { SetEditData } from '../edit-score.logic';

type CalculatorParams = Parameters<typeof useEditScoreCalculator>[0];

function makeState(overrides: Partial<EditScoreState> = {}): EditScoreState {
  return {
    p1Input: '',
    p2Input: '',
    p1Points: '0',
    p2Points: '0',
    nextServer: 'player1',
    tiebreakP1: '',
    tiebreakP2: '',
    newSets: [],
    note: '',
    ...overrides,
  };
}

function calc(overrides: Partial<CalculatorParams> = {}) {
  const { result } = renderHook(() =>
    useEditScoreCalculator({
      matchFormat: 'BEST_OF_3',
      completedSets: [],
      state: makeState(),
      tiebreakP1: '',
      tiebreakP2: '',
      ...overrides,
    }),
  );
  return result.current;
}

const oneSetWon: CompletedSet[] = [
  { games: { player1: 6, player2: 4 }, winner: 'player1' },
];

describe('use-edit-score-calculator — ramos de decisão (characterization R-15)', () => {
  describe('match tiebreak (MATCH_TB_10)', () => {
    it('MTB válido 10x8 habilita canConfirmSet e canConfirm (ramo 68/153)', () => {
      const r = calc({ matchFormat: 'MATCH_TB_10', state: makeState({ p1Input: '10', p2Input: '8' }) });

      expect(r.matchState.isMatchTiebreakSet).toBe(true);
      expect(r.validation.setValidationError).toBeUndefined();
      expect(r.canConfirmSet).toBe(true);
      expect(r.canConfirm).toBe(true);
      expect(r.partial).toBe(false);
    });

    it('MTB acima do limite (31x30) desabilita canConfirmSet e canConfirm com erro de validação', () => {
      const r = calc({ matchFormat: 'MATCH_TB_10', state: makeState({ p1Input: '31', p2Input: '30' }) });

      expect(r.matchState.isMatchTiebreakSet).toBe(true);
      expect(r.validation.setValidationError).toContain('Maximum 30');
      expect(r.validation.isSetTrulyCompleted).toBe(false);
      expect(r.canConfirmSet).toBe(false);
      expect(r.canConfirm).toBe(false);
      expect(r.partial).toBe(true);
    });
  });

  describe('inputs vazios (ramo 87)', () => {
    it('set já concluído permite confirmar mesmo com placar vazio (unfilled permitido)', () => {
      const r = calc({ completedSets: oneSetWon });

      expect(r.validation.bothFilled).toBe(false);
      expect(r.canConfirm).toBe(true);
    });

    it('sem sets e sem placar informado, confirmar fica desabilitado', () => {
      const r = calc();

      expect(r.validation.bothFilled).toBe(false);
      expect(r.canConfirm).toBe(false);
    });
  });

  describe('zero sem sets (ramo 102/116)', () => {
    it('0-0 com pontos de game informados confirma (ramo hasGamePoints=true)', () => {
      const r = calc({ state: makeState({ p1Input: '0', p2Input: '0', p1Points: '15', p2Points: '0' }) });

      expect(r.validation.p1Val).toBe(0);
      expect(r.validation.p2Val).toBe(0);
      expect(r.canConfirm).toBe(true);
    });

    it('0-0 sem pontos de game segue adiante e confirma (ramo hasGamePoints=false)', () => {
      const r = calc({ state: makeState({ p1Input: '0', p2Input: '0' }) });

      expect(r.canConfirm).toBe(true);
      expect(r.validation.isSetTrulyCompleted).toBe(false);
      expect(r.partial).toBe(true);
      expect(r.showGamePointsAtZero).toBe(false);
    });
  });

  describe('piso de placar (ramo 133/322)', () => {
    it('placar abaixo de floorCurrentSets desabilita e sinaliza currentScoreBelowOriginal', () => {
      const r = calc({
        state: makeState({ p1Input: '4', p2Input: '4' }),
        floorCurrentSets: { player1: 6, player2: 6 },
      });

      expect(r.canConfirm).toBe(false);
      expect(r.currentScoreBelowOriginal).toBe(true);
    });

    it('placar no piso não bloqueia nem sinaliza abaixo do original', () => {
      const r = calc({
        state: makeState({ p1Input: '6', p2Input: '4' }),
        floorCurrentSets: { player1: 6, player2: 4 },
      });

      expect(r.canConfirm).toBe(true);
      expect(r.currentScoreBelowOriginal).toBe(false);
    });
  });

  describe('piso de tiebreak (ramo 136-139)', () => {
    it('TB 4-4 abaixo de floorTiebreak 7-7 desabilita a confirmação', () => {
      const r = calc({
        state: makeState({ p1Input: '6', p2Input: '6' }),
        tiebreakP1: '4',
        tiebreakP2: '4',
        floorTiebreak: { player1: 7, player2: 7 },
      });

      expect(r.validation.hasTiebreak).toBe(true);
      expect(r.validation.isSetTrulyCompleted).toBe(false);
      expect(r.canConfirm).toBe(false);
      expect(r.currentScoreBelowOriginal).toBe(true);
    });

    it('TB 7-5 no piso não bloqueia', () => {
      const r = calc({
        state: makeState({ p1Input: '6', p2Input: '6' }),
        tiebreakP1: '7',
        tiebreakP2: '5',
        floorTiebreak: { player1: 7, player2: 5 },
      });

      expect(r.validation.isSetTrulyCompleted).toBe(true);
      expect(r.canConfirm).toBe(true);
      expect(r.currentScoreBelowOriginal).toBe(false);
    });
  });

  describe('tiebreak impossível (ramo 141)', () => {
    it('TB 8-5 em set 6-6 é impossível e desabilita a confirmação', () => {
      const r = calc({
        state: makeState({ p1Input: '6', p2Input: '6' }),
        tiebreakP1: '8',
        tiebreakP2: '5',
      });

      expect(r.tiebreakValidation.tiebreakImpossible).toBe(true);
      expect(r.validation.setValidationError).toContain('impossível');
      expect(r.canConfirmSet).toBe(false);
      expect(r.canConfirm).toBe(false);
    });
  });

  describe('erro de set sem tiebreak exigido (ramo 156)', () => {
    it('7x0 em BEST_OF_5 é placar impossível e desabilita a confirmação', () => {
      const r = calc({
        matchFormat: 'BEST_OF_5',
        state: makeState({ p1Input: '7', p2Input: '0' }),
      });

      expect(r.validation.setValidationError).toBeDefined();
      expect(r.validation.setValidation?.tiebreakRequired).toBeFalsy();
      expect(r.canConfirm).toBe(false);
    });
  });

  describe('showGamePointsAtZero (ramo 238)', () => {
    it('último set novo concluído (isPartial=false) exibe pontos de game no zero', () => {
      const newSets: SetEditData[] = [{ p1Games: 6, p2Games: 4, isPartial: false }];
      const r = calc({ state: makeState({ newSets }) });

      expect(r.showGamePointsAtZero).toBe(true);
    });

    it('último set novo parcial (isPartial=true) não exibe pontos de game', () => {
      const newSets: SetEditData[] = [{ p1Games: 6, p2Games: 6, isPartial: true }];
      const r = calc({ state: makeState({ newSets }) });

      expect(r.showGamePointsAtZero).toBe(false);
    });

    it('set concluído em completedSets sem sets novos também exibe no zero', () => {
      const r = calc({ completedSets: oneSetWon });

      expect(r.showGamePointsAtZero).toBe(true);
    });
  });

  describe('editableCompletedSets (ramo 254)', () => {
    it('conta sets editáveis em editableCompletedSets para decidir o set de match tiebreak', () => {
      const withEditable = calc({
        matchFormat: 'BEST_OF_3_MATCH_TB',
        editableCompletedSets: [
          { p1Games: 6, p2Games: 2, isPartial: false },
          { p1Games: 3, p2Games: 6, isPartial: false },
        ],
      });
      const withoutEditable = calc({ matchFormat: 'BEST_OF_3_MATCH_TB' });

      expect(withEditable.validation.isMatchTiebreakSet).toBe(true);
      expect(withoutEditable.validation.isMatchTiebreakSet).toBe(false);
    });
  });

  describe('canAddNextSet e partial', () => {
    it('set 6-4 concluído permite adicionar o próximo set', () => {
      const r = calc({ state: makeState({ p1Input: '6', p2Input: '4' }) });

      expect(r.validation.isSetTrulyCompleted).toBe(true);
      expect(r.canAddNextSet).toBe(true);
      expect(r.partial).toBe(false);
    });

    it('set 6-6 sem tiebreak informado bloqueia adicionar set e marca partial', () => {
      const r = calc({ state: makeState({ p1Input: '6', p2Input: '6' }) });

      expect(r.validation.hasTiebreak).toBe(true);
      expect(r.canAddNextSet).toBe(false);
      expect(r.canConfirmSet).toBe(false);
      expect(r.partial).toBe(true);
    });

    it('set que encerra o match não permite adicionar outro set', () => {
      const r = calc({
        completedSets: oneSetWon,
        state: makeState({ p1Input: '6', p2Input: '4' }),
      });

      expect(r.matchState.matchWouldEnd).toBe(true);
      expect(r.canAddNextSet).toBe(false);
    });
  });
});
