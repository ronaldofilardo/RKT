/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LiveCountersBar } from '../LiveCountersBar';
import { TacticalInsightBanner } from '../TacticalInsightBanner';
import type { LiveMatchCounters, TacticalInsight } from '@/core/scoring/live-tactical-insights';

describe('LiveCountersBar e TacticalInsightBanner', () => {
  const mockCounters: LiveMatchCounters = {
    aces: { p1: 3, p2: 1 },
    doubleFaults: { p1: 0, p2: 2 },
    breakPoints: {
      p1: { converted: 1, total: 2, pct: 50 },
      p2: { converted: 0, total: 1, pct: 0 },
    },
    breakPointsSaved: {
      p1: { saved: 1, total: 1, pct: 100 },
      p2: { saved: 1, total: 2, pct: 50 },
    },
    forcedErrors: { p1: 2, p2: 4 },
    unforcedErrors: { p1: 3, p2: 7 },
    totalPointsWon: { p1: 15, p2: 10 },
  };

  describe('LiveCountersBar', () => {
    it('não renderiza nada se não houver pontos jogados', () => {
      const emptyCounters: LiveMatchCounters = {
        aces: { p1: 0, p2: 0 },
        doubleFaults: { p1: 0, p2: 0 },
        breakPoints: { p1: { converted: 0, total: 0, pct: 0 }, p2: { converted: 0, total: 0, pct: 0 } },
        breakPointsSaved: { p1: { saved: 0, total: 0, pct: 0 }, p2: { saved: 0, total: 0, pct: 0 } },
        forcedErrors: { p1: 0, p2: 0 },
        unforcedErrors: { p1: 0, p2: 0 },
        totalPointsWon: { p1: 0, p2: 0 },
      };

      const { container } = render(
        <LiveCountersBar counters={emptyCounters} player1Name="Nadal" player2Name="Alcaraz" />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renderiza contadores corretamente com dados da partida', () => {
      render(
        <LiveCountersBar counters={mockCounters} player1Name="Nadal" player2Name="Alcaraz" />,
      );

      expect(screen.getByTestId('live-counters-bar')).toBeInTheDocument();
      expect(screen.getByText('Estatísticas ao Vivo')).toBeInTheDocument();
      expect(screen.getByText('Aces')).toBeInTheDocument();
      expect(screen.getByText('Duplas Faltas')).toBeInTheDocument();
      expect(screen.getByText('Break Points')).toBeInTheDocument();
    });

    it('permite colapsar e expandir com o botão', () => {
      render(
        <LiveCountersBar counters={mockCounters} player1Name="Nadal" player2Name="Alcaraz" />,
      );

      const toggleBtn = screen.getByRole('button', { name: /Recolher estatísticas/i });
      fireEvent.click(toggleBtn);

      // Deve ter recolhido os detalhes
      expect(screen.queryByText('Aces')).toBeNull();

      // Clica para expandir novamente
      const expandBtn = screen.getByRole('button', { name: /Expandir estatísticas/i });
      fireEvent.click(expandBtn);
      expect(screen.getByText('Aces')).toBeInTheDocument();
    });
  });

  describe('TacticalInsightBanner', () => {
    const mockInsights: TacticalInsight[] = [
      {
        id: 'insight-1',
        type: 'weakness',
        title: 'Fraqueza no Backhand',
        message: 'Alcaraz: 71% dos erros não-forçados no 2º set foram de Backhand.',
        playerSide: 'player2',
        icon: '⚠️',
      },
    ];

    it('não renderiza nada se a lista de insights for vazia', () => {
      const { container } = render(<TacticalInsightBanner insights={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renderiza banner de insight tático com ícone e mensagem', () => {
      render(<TacticalInsightBanner insights={mockInsights} />);

      expect(screen.getByTestId('tactical-insight-banner')).toBeInTheDocument();
      expect(screen.getByText('Fraqueza no Backhand')).toBeInTheDocument();
      expect(
        screen.getByText('Alcaraz: 71% dos erros não-forçados no 2º set foram de Backhand.'),
      ).toBeInTheDocument();
    });

    it('permite ocultar e reabrir o insight ao clicar no botão ocultar/ver', () => {
      render(<TacticalInsightBanner insights={mockInsights} />);

      const toggleBtn = screen.getByRole('button', { name: /Ocultar insight tático/i });
      expect(toggleBtn).toBeInTheDocument();
      expect(screen.getByText('Alcaraz: 71% dos erros não-forçados no 2º set foram de Backhand.')).toBeInTheDocument();

      // Clica em Ocultar
      fireEvent.click(toggleBtn);
      expect(screen.queryByText('Alcaraz: 71% dos erros não-forçados no 2º set foram de Backhand.')).toBeNull();
      expect(screen.getByRole('button', { name: /Expandir insight tático/i })).toBeInTheDocument();

      // Clica em Ver para reabrir
      fireEvent.click(screen.getByRole('button', { name: /Expandir insight tático/i }));
      expect(screen.getByText('Alcaraz: 71% dos erros não-forçados no 2º set foram de Backhand.')).toBeInTheDocument();
    });
  });
});
