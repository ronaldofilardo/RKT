/**
 * @jest-environment jsdom
 */
// Split de timeline-rows.test.tsx — describe "PointRow — regressão do novo layout
// (25 colunas, sem coluna SET)": cor da borda da linha conforme o PlayerColorProvider
// (partida em andamento × partida finalizada). Asserções 1:1.
import { makePoint, renderRowWithColors } from './timelineRowsTestKit';
import { resolvePlayerColors } from '@/components/ui/player-color.context';

describe('PointRow — regressão do novo layout (25 colunas, sem coluna SET) — borda por cor do atleta', () => {
  it('partida em andamento → borda segue a cor do atleta definida no provider', () => {
    // Em partida em andamento o provider colore o atleta que está sacando.
    const colors = resolvePlayerColors({
      state: 'IN_PROGRESS',
      player1: { id: 'p1' },
      player2: { id: 'p2' },
      initialServerId: 'player1',
    });

    const row1 = renderRowWithColors(colors, makePoint({ winner: 'PLAYER_1' })).querySelector('tr');
    expect(row1?.className).toContain('border-l-telemetry-volt');
    expect(row1?.className).not.toContain('border-l-white/10');

    const row2 = renderRowWithColors(colors, makePoint({ winner: 'PLAYER_2' })).querySelector('tr');
    expect(row2?.className).toContain('border-l-white/10');
    expect(row2?.className).not.toContain('border-l-telemetry-volt');
  });

  it('partida finalizada → borda na cor do atleta campeão (volt) nos pontos dele', () => {
    const colors = resolvePlayerColors({
      state: 'FINISHED',
      winnerId: 'p2',
      player1: { id: 'p1' },
      player2: { id: 'p2' },
    });

    const row1 = renderRowWithColors(colors, makePoint({ winner: 'PLAYER_1' })).querySelector('tr');
    expect(row1?.className).toContain('border-l-white/10');
    expect(row1?.className).not.toContain('border-l-telemetry-volt');

    const row2 = renderRowWithColors(colors, makePoint({ winner: 'PLAYER_2' })).querySelector('tr');
    expect(row2?.className).toContain('border-l-telemetry-volt');
    expect(row2?.className).not.toContain('border-l-white/10');
  });
});
