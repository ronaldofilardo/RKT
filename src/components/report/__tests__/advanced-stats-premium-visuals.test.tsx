/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { SetLensSection, FioDoJogoSection } from '../advanced-stats-premium-visuals';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import type { TimelinePoint } from '@/core/scoring/types';
import type { ReportData } from '@/app/match/[id]/report/report.types';

function createMockPoint(overrides: Partial<TimelinePoint> = {}): TimelinePoint {
  return {
    pointNumber: 1,
    server: 'player1',
    receiver: 'player2',
    serverScore: '0',
    receiverScore: '0',
    setNumber: 1,
    gameNumber: 1,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    winner: 'PLAYER_1',
    isBreakPoint: false,
    isGamePoint: false,
    isSetPoint: false,
    isMatchPoint: false,
    isTiebreak: false,
    type: 'WINNER',
    firstServeIn: true,
    isSecondServe: false,
    secondServeIn: false,
    rallyLength: 3,
    pointDetails: {} as any,
    ...overrides,
  };
}

describe('SetLensSection & FioDoJogoSection', () => {
  const points: TimelinePoint[] = [
    // Set 1 - Carlos (P1) domina
    createMockPoint({ pointNumber: 1, setNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'ACE', firstServeIn: true }),
    createMockPoint({ pointNumber: 2, setNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'WINNER', firstServeIn: true }),
    createMockPoint({ pointNumber: 3, setNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'WINNER', firstServeIn: true }),
    createMockPoint({ pointNumber: 4, setNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'ACE', firstServeIn: true, gameScore: { player1: 1, player2: 0 }, gamesScore: { player1: 1, player2: 0 } }),

    // P2 pontua 2 vezes seguidas
    createMockPoint({ pointNumber: 5, setNumber: 1, server: 'player2', winner: 'PLAYER_2', type: 'ACE', firstServeIn: true }),
    createMockPoint({ pointNumber: 6, setNumber: 1, server: 'player2', winner: 'PLAYER_2', type: 'WINNER', firstServeIn: true }),

    // P1 pontua mais 3 vezes seguidas
    createMockPoint({ pointNumber: 7, setNumber: 1, server: 'player2', winner: 'PLAYER_1', type: 'WINNER', isBreakPoint: true }),
    createMockPoint({ pointNumber: 8, setNumber: 1, server: 'player2', winner: 'PLAYER_1', type: 'WINNER' }),
    createMockPoint({ pointNumber: 9, setNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'ACE' }),

    // Set 2 - Rafael (P2) domina
    createMockPoint({ pointNumber: 10, setNumber: 2, server: 'player2', winner: 'PLAYER_2', type: 'ACE', firstServeIn: true }),
    createMockPoint({ pointNumber: 11, setNumber: 2, server: 'player2', winner: 'PLAYER_2', type: 'WINNER', firstServeIn: true }),
    createMockPoint({ pointNumber: 12, setNumber: 2, server: 'player2', winner: 'PLAYER_2', type: 'WINNER', firstServeIn: true }),
    createMockPoint({ pointNumber: 13, setNumber: 2, server: 'player2', winner: 'PLAYER_2', type: 'ACE', firstServeIn: true }),
  ];

  const stats = computeAdvancedStats(points);

  const mockReport: Partial<ReportData> = {
    matchId: 'match-123',
    player1: { id: 'p1', name: 'Carlos' },
    player2: { id: 'p2', name: 'Rafael' },
    format: 'BEST_OF_3' as any,
    timelinePoints: points,
    state: 'FINISHED',
  };

  describe('SetLensSection', () => {
    it('renderiza título e tabs para os sets da partida', () => {
      render(
        <SetLensSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      expect(screen.getByText(/Set Lens/i)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Set 1/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Set 2/i })).toBeInTheDocument();
    });

    it('exibe destaque animado para o vencedor do set', () => {
      render(
        <SetLensSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      // No Set 1, P1 marcou mais pontos
      const highlight = screen.getByTestId('set-winner-highlight');
      expect(highlight).toBeInTheDocument();
      expect(highlight).toHaveTextContent(/VITORIOSO/i);
      expect(highlight).toHaveTextContent(/Carlos/i);
    });

    it('renderiza o mini-radar SVG com eixos de desempenho', () => {
      render(
        <SetLensSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      const svg = screen.getByRole('img', { name: /Mini-radar de desempenho do set/i });
      expect(svg).toBeInTheDocument();
      expect(screen.getAllByText(/1º Saque/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Efic. Saque/i)).toBeInTheDocument();
    });

    it('renderiza barras comparativas do set selecionado', () => {
      render(
        <SetLensSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      expect(screen.getByText(/Games Ganhos/i)).toBeInTheDocument();
      expect(screen.getByText(/Pontos Totais/i)).toBeInTheDocument();
      expect(screen.getByText(/Erros \(ENF \+ EF\)/i)).toBeInTheDocument();
    });

    it('alterna o set ativo ao clicar na tab do Set 2', () => {
      render(
        <SetLensSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      const tabSet2 = screen.getByRole('tab', { name: /Set 2/i });
      fireEvent.click(tabSet2);

      // No Set 2, Rafael venceu
      expect(screen.getByText(/Vencedor do Set 2/i)).toBeInTheDocument();
      expect(screen.getByTestId('set-winner-highlight')).toHaveTextContent(/Rafael/i);
    });

    it('funciona perfeitamente sem o objeto report (fallback via stats.setBreakdown)', () => {
      render(
        <SetLensSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
        />
      );

      expect(screen.getByText(/Set Lens/i)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /Mini-radar/i })).toBeInTheDocument();
    });
  });

  describe('FioDoJogoSection', () => {
    it('renderiza cabeçalho, resumo de domínio e cards do flow chart', () => {
      render(
        <FioDoJogoSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      expect(screen.getByText(/Fio do Jogo/i)).toBeInTheDocument();
      expect(screen.getByText(/Domínio em Sequências/i)).toBeInTheDocument();
      expect(screen.getByText(/Maior Sequência/i)).toBeInTheDocument();
      expect(screen.getByText(/Super Runs \(4\+ Pts\)/i)).toBeInTheDocument();

      const runNodes = screen.getAllByTestId('flow-run-node');
      expect(runNodes.length).toBeGreaterThanOrEqual(2);
    });

    it('renderiza a fita ponto-a-ponto com contas interativas', () => {
      render(
        <FioDoJogoSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      expect(screen.getByText(/Fita Ponto-a-Ponto/i)).toBeInTheDocument();
      // Ponto 1 na fita
      const beads = screen.getAllByTestId('point-bead');
      expect(beads.length).toBeGreaterThanOrEqual(1);

      // Clicar no ponto abre a telemetria do lance
      fireEvent.click(beads[0]);
      expect(screen.getByText(/Ponto #1/i)).toBeInTheDocument();
    });

    it('permite filtrar sequências por set', () => {
      render(
        <FioDoJogoSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
          report={mockReport as ReportData}
        />
      );

      const set1Filter = screen.getByRole('button', { name: /^Set 1$/i });
      fireEvent.click(set1Filter);

      // Deve manter apenas runs do Set 1
      const runNodes = screen.getAllByTestId('flow-run-node');
      runNodes.forEach((node) => {
        expect(node).toHaveTextContent(/Set 1/i);
      });
    });

    it('funciona perfeitamente sem timelinePoints (fallback)', () => {
      render(
        <FioDoJogoSection
          stats={stats}
          player1Name="Carlos"
          player2Name="Rafael"
        />
      );

      expect(screen.getByText(/Fio do Jogo/i)).toBeInTheDocument();
      expect(screen.getByText(/Domínio em Sequências/i)).toBeInTheDocument();
    });
  });
});

