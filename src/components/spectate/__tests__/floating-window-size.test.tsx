/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PANEL_WIDTH } from '../use-floating-window';
import { FloatingSpectatorPanel } from '../FloatingSpectatorPanel';

/**
 * Regressão: o placar do acompanhamento (ScoreboardCard, table-fixed) tinha o "Pts"
 * (30/40) cortado no popup. Larguras do cartão em >= sm:
 * nome 120 + vencedor 24 + 3 sets x 48 + game 48 = 336px.
 */
const SCOREBOARD_WIDTH = 120 + 24 + 3 * 48 + 48;
const BODY_PADDING = 12 * 2; // p-3 nos dois lados
const SCROLLBAR = 17; // barra de rolagem clássica (pior caso)

describe('largura do popup de acompanhamento', () => {
  it('comporta o placar completo com padding e barra de rolagem vertical', () => {
    expect(PANEL_WIDTH - BODY_PADDING - SCROLLBAR).toBeGreaterThanOrEqual(SCOREBOARD_WIDTH);
  });

  it('aplica PANEL_WIDTH como largura da janela no desktop', () => {
    render(
      <FloatingSpectatorPanel
        title="Ana × Bia" updateText="agora" isDesktop pos={{ x: 10, y: 20 }} zIndex={60}
        dragHandlers={{}} auto={false} onToggleAuto={() => {}} isRefreshing={false}
        onRefresh={() => {}} onMinimize={() => {}} onClose={() => {}} onFocus={() => {}}
      >
        <span>corpo</span>
      </FloatingSpectatorPanel>,
    );
    expect(screen.getByRole('dialog')).toHaveStyle({ width: `${PANEL_WIDTH}px`, left: '10px', top: '20px' });
  });

  it('no celular (bottom-sheet) não fixa largura em px', () => {
    render(
      <FloatingSpectatorPanel
        title="Ana × Bia" updateText="agora" isDesktop={false} pos={{ x: 0, y: 0 }} zIndex={60}
        dragHandlers={{}} auto={false} onToggleAuto={() => {}} isRefreshing={false}
        onRefresh={() => {}} onMinimize={() => {}} onClose={() => {}} onFocus={() => {}}
      >
        <span>corpo</span>
      </FloatingSpectatorPanel>,
    );
    expect(screen.getByRole('dialog').style.width).toBe('');
  });
});
