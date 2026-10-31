/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StrokeMatrixSection } from '../advanced-stats-stroke-matrix-section';
import { computeAdvancedStats, computeStrokeMatrixStats } from '@/core/report/compute-stats';
import type { AdvancedMatchStats } from '@/core/report/compute-stats';

const STROKE_NAMES = computeStrokeMatrixStats([], 'PLAYER_1').map((r) => r.name);

function renderSection(stats: AdvancedMatchStats) {
  render(
    <StrokeMatrixSection stats={stats} player1Name="Jogador Um" player2Name="Jogador Dois" />
  );
}

describe('StrokeMatrixSection - "8. Estatísticas dos Golpes"', () => {
  it('exibe sempre as 13 linhas de golpes, mesmo com todos os contadores zerados', () => {
    renderSection(computeAdvancedStats([]));

    for (const name of STROKE_NAMES) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(STROKE_NAMES).toHaveLength(13);
  });

  it('exibe o rótulo "Golpes" na coluna central do cabeçalho', () => {
    renderSection(computeAdvancedStats([]));

    expect(screen.getByText('Golpes')).toBeInTheDocument();
  });

  it('usa "|" como separador dos valores W | EF | ENF', () => {
    renderSection(computeAdvancedStats([]));

    // 4 separadores por linha (2 do P1 + 2 do P2) x 13 golpes
    expect(screen.getAllByText('|')).toHaveLength(52);
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('não renderiza explicações entre parênteses nos rótulos nem na legenda', () => {
    renderSection(computeAdvancedStats([]));

    expect(screen.queryByText(/Saque\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deixadinha/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\(Winners\)/)).not.toBeInTheDocument();

    const legend = screen.getByText(/Formato:/);
    expect(legend.textContent).not.toContain('(');
    expect(legend.textContent).toContain('W');
    expect(legend.textContent).toContain('EF');
    expect(legend.textContent).toContain('ENF');
  });

  it('mantém o total entre parênteses ao final de cada linha', () => {
    renderSection(computeAdvancedStats([]));

    // 13 golpes x 2 lados, cada linha terminando com o total "(N)"
    expect(screen.getAllByText(/\(\d+\)/)).toHaveLength(26);
  });
});
