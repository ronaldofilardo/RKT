/**
 * @jest-environment jsdom
 */
// Split de timeline-rows.test.tsx — describe "PointRow — regressão do novo layout
// (25 colunas, sem coluna SET)": cascata GOLPE/EFEITO/DIREÇÃO, badge de tipo e
// linha de gap (marcação interrompida). Asserções 1:1.
import { screen } from '@testing-library/react';
import { makePoint, renderRow } from './timelineRowsTestKit';

describe('PointRow — regressão do novo layout (25 colunas, sem coluna SET) — cascata e gap', () => {
  it('Winner em rally comum (sem nenhum erro de saque): cascata mostra golpe/efeito/direção normalmente', () => {
    const container = renderRow(makePoint({
      type: 'WINNER',
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
    const text = container.textContent ?? '';
    expect(text).toContain('W');
    expect(text).toContain('FQ');
    expect(text).toContain('FH');
    expect(text).toContain('Top');
    expect(text).toContain('X');
  });

  it('Erro não forçado em rally: badge ENF', () => {
    const container = renderRow(makePoint({
      type: 'UNFORCED_ERROR',
      rallyLength: 2,
      rallyDetails: {
        vencedor: 'devolvedor',
        situacao: 'fundo',
        tipo: 'erro_nao_forcado',
        golpe: 'bh',
        subtipo2: 'net',
        previewBalls: 2,
      } as any,
    }));
    const text = container.textContent ?? '';
    expect(text).toContain('ENF');
    expect(text).toContain('BH');
  });

  it('Ponto sem rallyDetails: badge TIPO mostra –', () => {
    const container = renderRow(makePoint({
      type: 'WINNER',
      rallyDetails: null,
      firstFault: undefined,
    }));
    const text = container.textContent ?? '';
    expect(text).toContain('–');
  });

  it('hasGap renderiza linha separadora "marcação interrompida"', () => {
    renderRow(makePoint({}), { hasGap: true });
    expect(screen.getByText('marcação interrompida')).toBeInTheDocument();
  });
});
