/**
 * @jest-environment jsdom
 */
// Split de timeline-rows.test.tsx — describe "PointRow — regressão do novo layout (25 colunas, sem coluna SET)": dupla falta e rally pós-erro. Asserções 1:1.
import { makePoint, renderRowCells } from './timelineRowsTestKit';

describe('PointRow — regressão do novo layout (25 colunas, sem coluna SET) — dupla falta e rally pós-erro', () => {
  it('Dupla Falta: seção 1º saque mostra o 1o erro, seção 2º saque mostra o 2o erro (OUT/NET + EFE/DIR do 2o); cascata em branco', () => {
    const cells = renderRowCells(makePoint({
      type: 'DOUBLE_FAULT',
      isFirstServe: false,
      isSecondServe: true,
      firstServeOutcome: 'out',
      secondServeOutcome: 'net',
      firstFault: { errorType: 'out', serveEffect: 'topspin', direction: 'aberto' },
      rallyDetails: {
        vencedor: 'devolvedor',
        situacao: 'saque',
        tipo: 'dupla_falta',
        golpe: 'saque',
        subtipo2: 'net',
        efeito: 'flat',
        direcao: 'fechado',
        previewBalls: 1,
      } as any,
    }));
    expect(cells[6]).toBe('OUT'); // 1o saque
    expect(cells[8]).toBe('Top');
    expect(cells[9]).toBe('Ab');
    expect(cells[12]).toBe('NET'); // 2o saque
    expect(cells[13]).toBe('Flat');
    expect(cells[14]).toBe('Fe');
    expect(cells[15]).toBe('–'); // SITUAÇÃO
    expect(cells[19]).toBe('–'); // GOLPE
  });

  it('Erro no 1º saque + acerto no 2º (rally comum): seção 1º saque mostra o erro, seção 2º fica vazia, cascata mostra os detalhes do rally', () => {
    const cells = renderRowCells(makePoint({
      type: 'WINNER',
      isFirstServe: false,
      isSecondServe: true,
      firstServeOutcome: 'out',
      secondServeOutcome: null,
      firstFault: { errorType: 'out', serveEffect: 'topspin', direction: 'aberto' },
      rallyLength: 4,
      rallyDetails: {
        vencedor: 'sacador',
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        efeito: 'topspin',
        direcao: 'cruzada',
        previewBalls: 4,
      } as any,
    }));
    // 1o saque: mostra só o erro
    expect(cells[6]).toBe('OUT');
    expect(cells[8]).toBe('Top');
    expect(cells[9]).toBe('Ab');
    // 2o saque: nenhum ACE/OUT/NET (o 2o saque foi bom)
    expect(cells[10]).toBe('–');
    expect(cells[11]).toBe('–');
    expect(cells[12]).toBe('–');
    expect(cells[13]).toBe('–');
    expect(cells[14]).toBe('–');
    // cascata mostra o rally normalmente
    expect(cells[15]).toBe('FQ'); // SITUAÇÃO
    expect(cells[19]).toBe('FH'); // GOLPE
    expect(cells[20]).toBe('Top'); // EFEITO
    expect(cells[21]).toBe('X'); // DIREÇÃO
  });
});
