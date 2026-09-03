/**
 * Regressão (2026-09-02): BEST_OF_5, 5º set (Match Tiebreak decisivo em 2x2).
 *
 * Reportado: no placar dinâmico, o 5º set aparecia como "10/8" (os pontos
 * do match tiebreak), quando o correto é aparecer o games do set, ex.
 * "7/6" (com o "(8)" do tiebreak sendo só um detalhe visual à parte).
 *
 * Causa raiz: `createSetEditData` salvava `p1Games`/`p2Games` = p1Val/p2Val
 * diretamente, que para um set de Match Tiebreak são os PONTOS do
 * tiebreak (ex.: 10x8), não o games do set. O motor de pontuação ao vivo
 * (completeSetWithTiebreak) sempre produz games = baseGames+1 para o
 * vencedor — 6+1=7 para o 5º set do BEST_OF_5 (que só vira MT em 6x6), ou
 * 0+1=1 para os formatos de MT "puro" (MATCH_TB_10 etc., que começam o
 * set já em 0x0). O modal de edição não replicava essa conversão.
 */
import { createSetEditData } from '../edit-score-logic';

describe('createSetEditData — games do set de Match Tiebreak (bug 2026-09-02)', () => {
  it('BEST_OF_5, 5º set 10x8: deve salvar games 7x6 (não 10x8)', () => {
    const result = createSetEditData({
      p1Val: 10,
      p2Val: 8,
      isSetTrulyCompleted: true,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: true,
      isPotentialMTSet: false,
      p1Points: '0',
      p2Points: '0',
      currentSets: { player1: 6, player2: 6 },
      matchFormat: 'BEST_OF_5',
    });

    expect(result.p1Games).toBe(7);
    expect(result.p2Games).toBe(6);
    expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
  });

  it('BEST_OF_5, 5º set 8x10 (player2 vence): deve salvar games 6x7', () => {
    const result = createSetEditData({
      p1Val: 8,
      p2Val: 10,
      isSetTrulyCompleted: true,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: true,
      isPotentialMTSet: false,
      p1Points: '0',
      p2Points: '0',
      currentSets: { player1: 6, player2: 6 },
      matchFormat: 'BEST_OF_5',
    });

    expect(result.p1Games).toBe(6);
    expect(result.p2Games).toBe(7);
    expect(result.tiebreakScore).toEqual({ player1: 8, player2: 10 });
  });

  it('MATCH_TB_10 (MT puro, começa em 0x0): deve salvar games 1x0', () => {
    const result = createSetEditData({
      p1Val: 10,
      p2Val: 7,
      isSetTrulyCompleted: true,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: true,
      isPotentialMTSet: false,
      p1Points: '0',
      p2Points: '0',
      currentSets: { player1: 0, player2: 0 },
      matchFormat: 'MATCH_TB_10',
    });

    expect(result.p1Games).toBe(1);
    expect(result.p2Games).toBe(0);
    expect(result.tiebreakScore).toEqual({ player1: 10, player2: 7 });
  });
});
