/**
 * @jest-environment jsdom
 */
// Split de timeline-rows.test.tsx — describe "PointRow — regressão do novo layout
// (25 colunas, sem coluna SET)": casos das seções de 1º/2º saque. Asserções 1:1.
import { makePoint, renderRowCells } from './timelineRowsTestKit';

describe('PointRow — regressão do novo layout (25 colunas, sem coluna SET) — seções de saque', () => {
  it('ACE no 1º saque: mostra ACE + efeito/direção do próprio ace na seção 1º saque; cascata (GOLPE/EFEITO/DIREÇÃO/SITUAÇÃO) fica em branco', () => {
    const cells = renderRowCells(makePoint({
      type: 'ACE',
      isFirstServe: true,
      isSecondServe: false,
      firstServeOutcome: 'ace',
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'saque',
        tipo: 'winner',
        golpe: 'saque',
        efeito: 'flat',
        direcao: 'fechado',
        previewBalls: 1,
      } as any,
    }));
    // [0]=no., [1]=SAC, [2]=Venc, [3]=GAMES, [4]=PONTOS,
    // [5]=1oSaque-ACE, [6]=OUT, [7]=NET, [8]=EFE, [9]=DIR,
    // [10]=2oSaque-ACE, [11]=OUT, [12]=NET, [13]=EFE, [14]=DIR,
    // [15]=SITUAÇÃO, [16]=TIPO, [17]=SUBTIPO1, [18]=SUBTIPO2, [19]=GOLPE, [20]=EFEITO, [21]=DIREÇÃO
    expect(cells[5]).toBe('ACE');
    expect(cells[8]).toBe('Flat');
    expect(cells[9]).toBe('Fe');
    // 2o saque inteiramente vazio (o ace foi no 1o)
    expect(cells[10]).toBe('–');
    expect(cells[13]).toBe('–');
    expect(cells[14]).toBe('–');
    // cascata (SITUAÇÃO em diante) não deve repetir os detalhes do saque
    expect(cells[15]).toBe('–'); // SITUAÇÃO
    expect(cells[19]).toBe('–'); // GOLPE
    expect(cells[20]).toBe('–'); // EFEITO
    expect(cells[21]).toBe('–'); // DIREÇÃO
  });

  it('Erro no 1º saque + ACE no 2º saque: seção 1º saque mostra o erro (com EFE/DIR do erro), seção 2º saque mostra o ACE (com EFE/DIR do próprio ace)', () => {
    const cells = renderRowCells(makePoint({
      type: 'ACE',
      isFirstServe: false,
      isSecondServe: true,
      firstServeOutcome: 'out',
      secondServeOutcome: 'ace',
      firstFault: {
        errorType: 'out',
        serveEffect: 'topspin',
        direction: 'aberto',
      },
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'saque',
        tipo: 'winner',
        golpe: 'saque',
        efeito: 'flat',
        direcao: 'centro',
        previewBalls: 1,
      } as any,
    }));
    // 1o saque: OUT + efeito/direção do ERRO (não do ace)
    expect(cells[6]).toBe('OUT');
    expect(cells[8]).toBe('Top');
    expect(cells[9]).toBe('Ab');
    // 2o saque: ACE + efeito/direção do próprio ace
    expect(cells[10]).toBe('ACE');
    expect(cells[13]).toBe('Flat');
    expect(cells[14]).toBe('Ce');
    // cascata continua vazia (o 2o saque decidiu o ponto)
    expect(cells[19]).toBe('–'); // GOLPE
  });
});
