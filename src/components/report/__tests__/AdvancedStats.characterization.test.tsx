/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { AdvancedStats } from '../AdvancedStats';
import { computeAdvancedStats } from '@/core/report/compute-stats';
import type { TimelinePoint } from '@/core/scoring/types';

function createMockPoint(overrides: Partial<TimelinePoint> = {}): TimelinePoint {
  return {
    pointNumber: 1,
    server: 'player1',
    receiver: 'player2',
    serverScore: '0',
    receiverScore: '0',
    setNumber: 1,
    gameNumber: 1,
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
    ...overrides,
  };
}

describe('AdvancedStats - Regras 1 a 7', () => {
  const points: TimelinePoint[] = [
    // P1 saca e faz Ace
    createMockPoint({ pointNumber: 1, server: 'player1', winner: 'PLAYER_1', type: 'ACE', firstServeIn: true }),
    // P1 saca e faz Dupla Falta
    createMockPoint({ pointNumber: 2, server: 'player1', winner: 'PLAYER_2', type: 'DOUBLE_FAULT', firstServeIn: false, isSecondServe: true }),
    // P1 saca, troca de fundo e P1 faz winner
    createMockPoint({ pointNumber: 3, server: 'player1', winner: 'PLAYER_1', type: 'WINNER', rallyDetails: { situacao: 'fundo', golpe: 'fh' } as any }),
    // P2 saca, devolução 1º saque entra, P1 vence ponto
    createMockPoint({ pointNumber: 4, server: 'player2', winner: 'PLAYER_1', type: 'WINNER', firstServeIn: true, rallyDetails: { situacao: 'devolucao' } as any }),
  ];

  const stats = computeAdvancedStats(points);

  it('não renderiza o tópico 10. Breakdown por Set (Item 2)', () => {
    render(<AdvancedStats stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    expect(screen.queryByText(/Breakdown por Set/i)).toBeNull();
    expect(screen.queryByText(/10\./i)).toBeNull();
  });

  it('exibe tópicos de Momentum com rótulos de sequências ganhas e sem sequência atual/rodapé (Item 4)', () => {
    render(<AdvancedStats stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    // Cards existem
    expect(screen.getByText('9. Momentum')).toBeInTheDocument();
    // Sequência atual e rodapé foram removidos
    expect(screen.queryByText(/Sequência atual:/i)).toBeNull();
    expect(screen.queryByText(/Sequências de 2\+ Pontos/i)).toBeNull();
    // Tabela exibe novas descrições
    expect(screen.getByText('2 pontos ganhos seguidos')).toBeInTheDocument();
    expect(screen.getByText('3 pontos ganhos seguidos')).toBeInTheDocument();
    expect(screen.getByText('4+ pontos ganhos seguidos')).toBeInTheDocument();
  });

  it('exibe termos "Won" no tópico 6. Pontos de Pressão (Item 5)', () => {
    render(<AdvancedStats stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    expect(screen.getByText('Games Points Won')).toBeInTheDocument();
    expect(screen.getByText('% Games Points Won')).toBeInTheDocument();
    expect(screen.getByText('Set Points Won')).toBeInTheDocument();
    expect(screen.getByText('% Set Points Won')).toBeInTheDocument();
    expect(screen.getByText('Tiebreaks Won')).toBeInTheDocument();
  });

  it('exibe o tópico 2. Devolução na ordem solicitada e sem Total Break points / Break points Won (Item 6)', () => {
    render(<AdvancedStats stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    // BPs removidos
    expect(screen.queryByText('Total Break points')).toBeNull();
    expect(screen.queryByText('Break points Won')).toBeNull();
    // Novos critérios presentes
    expect(screen.getByText('% Devolução 1º saque em quadra')).toBeInTheDocument();
    expect(screen.getByText('% pontos ganhos na devolução de 1º saque')).toBeInTheDocument();
    expect(screen.getByText('% dev 2º saque em quadra')).toBeInTheDocument();
    expect(screen.getByText('% pontos ganhos na dev 2º saque')).toBeInTheDocument();
    expect(screen.getByText('Games ganhos devolvendo')).toBeInTheDocument();
  });

  it('inclui Aces em Winners e DFs em ENF no tópico 7. Definição do Ponto (Item 3)', () => {
    render(<AdvancedStats stats={stats} player1Name="Carlos" player2Name="Rafael" />);
    expect(screen.getByText('7. Definição do Ponto')).toBeInTheDocument();
    expect(screen.getAllByText('Winners').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Erros Não Forçados').length).toBeGreaterThanOrEqual(1);
    // P1 tem 3 winners (Ace pt 1 + Winner pt 3 + Winner pt 4)
    expect(stats.pointDefinition?.player1.cleanWinners).toBe(3);
    // P1 tem 1 ENF (DF pt 2)
    expect(stats.pointDefinition?.player1.unforcedErrors).toBe(1);
  });

  it('no Fundo de Quadra entram apenas os de situacao="fundo" (Item 7)', () => {
    // pt 1 (Ace), pt 2 (DF), pt 4 (devolucao) não entram em baseline
    // apenas pt 3 (fundo) entra
    expect(stats.baseline?.player1.winners).toBe(1);
    expect(stats.baseline?.player1.total).toBe(1);
  });
});
