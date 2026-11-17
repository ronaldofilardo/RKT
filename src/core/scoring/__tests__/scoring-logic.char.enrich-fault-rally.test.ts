/**
 * Split de scoring-logic.characterization.test.ts — describe "enrichPointsFromHistory"
 * (firstFault e rallyDetails): firstFault por firstFaultDetail (regressão:
 * independente do type do ponto), preservação de rallyDetails e note.
 * Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../scoring-logic';
import { createHistoryEntry, createPointLog } from './scoringLogicTestKit';

describe('enrichPointsFromHistory — firstFault e rallyDetails', () => {
  it('sets firstFault from point.firstFaultDetail for DOUBLE_FAULT', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'DOUBLE_FAULT', firstFaultDetail: 'WIDE' }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].firstFault).toBe('WIDE');
  });

  // Regressão: antes do fix, firstFault só era preenchido para
  // type === 'DOUBLE_FAULT'. Isso perdia o detalhe do erro de 1º saque
  // sempre que o ponto terminava em Ace no 2º saque (ou em rally comum
  // após acerto do 2º saque) — a coluna "1º Saque" da timeline ficava
  // sem OUT/NET/EFE/DIR nesses casos. Agora firstFault depende só de
  // existir firstFaultDetail, independente do type do ponto.
  it('sets firstFault from point.firstFaultDetail for ACE on 2nd serve (regressão)', () => {
    const history = [createHistoryEntry({
      point: createPointLog({ type: 'ACE', isSecondServe: true, isFirstServe: false, firstFaultDetail: 'WIDE' }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].firstFault).toBe('WIDE');
  });

  it('sets firstFault from point.firstFaultDetail for a common rally point after a good 2nd serve (regressão)', () => {
    const history = [createHistoryEntry({
      point: createPointLog({ type: 'WINNER', isSecondServe: true, isFirstServe: false, firstFaultDetail: 'WIDE' }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].firstFault).toBe('WIDE');
  });

  it('sets firstFault undefined when there is no firstFaultDetail, regardless of type', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'ACE', firstFaultDetail: null }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].firstFault).toBeUndefined();
  });

  it('sets firstFault undefined when firstFaultDetail is null', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'DOUBLE_FAULT', firstFaultDetail: null }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].firstFault).toBeUndefined();
  });

  it('preserves rallyDetails from point', () => {
    const history = [createHistoryEntry({
      point: createPointLog({ rallyDetails: { situacao: 'saque', tipo: 'ace', subtipo1: 't', subtipo2: 'wide', efeito: 'flat' } }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].rallyDetails).toEqual({ situacao: 'saque', tipo: 'ace', subtipo1: 't', subtipo2: 'wide', efeito: 'flat' });
  });

  it('sets rallyDetails to null when undefined', () => {
    const history = [createHistoryEntry({ point: createPointLog({ rallyDetails: undefined }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].rallyDetails).toBeNull();
  });

  it('sets note from rallyDetails.note', () => {
    const history = [createHistoryEntry({ point: createPointLog({ rallyDetails: { situacao: 'rally', note: 'Great point!' } }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].note).toBe('Great point!');
  });

  it('sets pointDetails to full point log', () => {
    const point = createPointLog({ type: 'WINNER' });
    const history = [createHistoryEntry({ point })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].pointDetails).toEqual(point);
  });
});
