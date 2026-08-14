/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MatchTimelineView } from '../MatchTimelineView';
import type { TimelinePoint } from '@/core/scoring/types';

function makePoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'ACE',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: {
      vencedor: 'sacador',
      situacao: 'saque',
      golpe: 'saque',
      efeito: 'topspin',
      direcao: 'aberto',
    } as any,
    pointDetails: {} as any,
    ...overrides,
  } as TimelinePoint;
}

describe('MatchTimelineView — cabeçalhos e legenda (itens 4, 5 e reorganização C)', () => {
  it('itens 4/5: cabeçalhos renomeados e sem coluna "ACE" nem os antigos "BOLA/GAME/PONTO/SUB1"', () => {
    render(
      <MatchTimelineView
        points={[makePoint({})]}
        player1Name="Ronaldo"
        player2Name="Mateus"
        matchId="match-1"
      />
    );

    // Cabeçalhos da tabela: usar getAllByText porque "SAQUE" também aparece
    // dentro da legenda explicativa ("Como ler esta tabela") como <strong>.
    expect(screen.getAllByText('SAQUE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PLACAR GAMES').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PLACAR GAME').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('VENCEDOR').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ONDE ERROU')).toBeInTheDocument();
    expect(screen.getByText('SUBTIPO')).toBeInTheDocument();
    expect(screen.getByText('OBSERVAÇÃO')).toBeInTheDocument();

    expect(screen.queryByText('ACE', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('BOLA')).not.toBeInTheDocument();
    expect(screen.queryByText('GAME', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('PONTO', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('SUB1')).not.toBeInTheDocument();
  });

  it('reorganização (C): legenda explica os códigos para leitor que não assistiu a partida', () => {
    render(
      <MatchTimelineView
        points={[makePoint({})]}
        player1Name="Ronaldo"
        player2Name="Mateus"
        matchId="match-1"
      />
    );

    expect(screen.getByText(/Como ler esta tabela/)).toBeInTheDocument();
    expect(screen.getByText(/Break Point/)).toBeInTheDocument();
    expect(screen.getByText(/Dupla Falta/)).toBeInTheDocument();
    expect(screen.getByText(/faixas \(1-2, 3-6, 7-10, 11\+\)/)).toBeInTheDocument();
  });
});
