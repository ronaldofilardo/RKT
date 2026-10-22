/**
 * Testes de regressao -- Bugs do Match Tiebreak parcial em Editar Placar
 *
 * Bugs corrigidos:
 * A) refreshEditScoreFloor retornava o placar do set anterior (2x6 em games)
 *    como piso do Match Tiebreak em andamento (4x4 em pontos) -- unidades incompativeis.
 * B) createSetEditData chamava applyMatchTiebreakSetData incondicionalmente,
 *    forcando um vencedor errado em MTB parcial (ex.: 4x4 -> player2 vence, absurdo).
 * C) buildNewScoringState.buildCurrentGame ignorava MTB parcial, podendo ler
 *    currentGamePoints inexistentes em vez de retornar zeros.
 */

import { buildNewScoringState } from '../useSessionManager.state-builder';
import { createSetEditData } from '@/core/scoring/edit-score-state';

function makeMatchTiebreakPartialSet(p1: number, p2: number) {
  return createSetEditData({
    p1Val: p1,
    p2Val: p2,
    isSetTrulyCompleted: false,
    hasTiebreak: false,
    tiebreakP1Num: 0,
    tiebreakP2Num: 0,
    isMatchTiebreakSet: true,
    isPotentialMTSet: false,
    p1Points: '0',
    p2Points: '0',
    matchFormat: 'SHORT_SET_2V2_NO_AD',
  });
}

describe('createSetEditData -- Match Tiebreak parcial', () => {
  it('4x4 parcial: isPartial=true, tiebreakScore={4,4}, sem games de vencedor', () => {
    const result = makeMatchTiebreakPartialSet(4, 4);
    expect(result.isPartial).toBe(true);
    expect(result.tiebreakScore).toEqual({ player1: 4, player2: 4 });
    expect(result.p1Games).toBe(4);
    expect(result.p2Games).toBe(4);
  });

  it('0x0 parcial (inicio MTB): isPartial=true, tiebreakScore={0,0}', () => {
    const result = makeMatchTiebreakPartialSet(0, 0);
    expect(result.isPartial).toBe(true);
    expect(result.tiebreakScore).toEqual({ player1: 0, player2: 0 });
  });

  it('10x4 completo: applyMatchTiebreakSetData roda, vencedor player1', () => {
    const result = createSetEditData({
      p1Val: 10, p2Val: 4,
      isSetTrulyCompleted: true,
      hasTiebreak: false, tiebreakP1Num: 0, tiebreakP2Num: 0,
      isMatchTiebreakSet: true, isPotentialMTSet: false,
      p1Points: '0', p2Points: '0',
      matchFormat: 'SHORT_SET_2V2_NO_AD',
    });
    expect(result.isPartial).toBe(false);
    expect(result.tiebreakScore).toEqual({ player1: 10, player2: 4 });
    expect(result.p1Games).toBe(1);
    expect(result.p2Games).toBe(0);
  });
});

describe('buildNewScoringState -- Match Tiebreak parcial (SHORT_SET_2V2_NO_AD)', () => {
  const s1 = { p1Games: 6, p2Games: 3, isPartial: false };
  const s2 = { p1Games: 2, p2Games: 6, isPartial: false };

  it('MTB parcial 4x4: currentGame deve ser zerado', () => {
    const mtb = makeMatchTiebreakPartialSet(4, 4);
    const state = buildNewScoringState({ setResults: [s1, s2, mtb], server: 'player1', format: 'SHORT_SET_2V2_NO_AD' });
    expect(state.currentGame).toMatchObject({ player1: 0, player2: 0, isDeuce: false, advantage: null });
  });

  it('MTB parcial 4x4: set MTB tem tiebreakScore={4,4}', () => {
    const mtb = makeMatchTiebreakPartialSet(4, 4);
    const state = buildNewScoringState({ setResults: [s1, s2, mtb], server: 'player2', format: 'SHORT_SET_2V2_NO_AD' });
    const mtbSet = state.sets.find((s) => s.isTiebreak);
    expect(mtbSet?.tiebreakScore).toEqual({ player1: 4, player2: 4 });
  });

  it('MTB parcial 4x4: partida nao finalizada', () => {
    const mtb = makeMatchTiebreakPartialSet(4, 4);
    const state = buildNewScoringState({ setResults: [s1, s2, mtb], server: 'player1', format: 'SHORT_SET_2V2_NO_AD' });
    expect(state.isFinished).toBe(false);
    expect(state.winner).toBeNull();
  });

  it('MTB finalizado 10x4: partida finalizada, vencedor player1', () => {
    const mtbDone = createSetEditData({
      p1Val: 10, p2Val: 4, isSetTrulyCompleted: true,
      hasTiebreak: false, tiebreakP1Num: 0, tiebreakP2Num: 0,
      isMatchTiebreakSet: true, isPotentialMTSet: false,
      p1Points: '0', p2Points: '0', matchFormat: 'SHORT_SET_2V2_NO_AD',
    });
    const state = buildNewScoringState({ setResults: [s1, s2, mtbDone], server: 'player1', format: 'SHORT_SET_2V2_NO_AD' });
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.currentGame).toMatchObject({ player1: 0, player2: 0 });
  });
});
