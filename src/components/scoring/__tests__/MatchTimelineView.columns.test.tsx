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

describe('MatchTimelineView — cabeçalhos e legenda (novo layout 23 colunas)', () => {
  it('cabeçalhos de nível 1: SET, PLACAR, 1º Saque, 2º Saque, SITUAÇÃO, TIPO', () => {
    render(
      <MatchTimelineView
        points={[makePoint({})]}
        player1Name="Ronaldo"
        player2Name="Mateus"
        matchId="match-1"
      />
    );

    expect(screen.getByText('SET', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('PLACAR', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('1º Saque', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('2º Saque', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('SITUAÇÃO', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('ENF, EF, W')).toBeInTheDocument();
  });

  it('cabeçalhos de nível 2: no., P/, SAC, GAMES, PONTOS, ACE, OUT, NET, EFE, DIR', () => {
    render(
      <MatchTimelineView
        points={[makePoint({})]}
        player1Name="Ronaldo"
        player2Name="Mateus"
        matchId="match-1"
      />
    );

    expect(screen.getByText('no.', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('P/', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('SAC', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('GAMES', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('PONTOS', { selector: 'th' })).toBeInTheDocument();
    // ACE, OUT, NET aparecem nos headers de saque
    const aceHeaders = screen.getAllByText('ACE', { selector: 'th' });
    expect(aceHeaders.length).toBe(2); // 1º e 2º saque
    const outHeaders = screen.getAllByText('OUT', { selector: 'th' });
    expect(outHeaders.length).toBe(2);
    const netHeaders = screen.getAllByText('NET', { selector: 'th' });
    expect(netHeaders.length).toBe(2);
    const efeHeaders = screen.getAllByText('EFE', { selector: 'th' });
    expect(efeHeaders.length).toBe(2);
    const dirHeaders = screen.getAllByText('DIR', { selector: 'th' });
    expect(dirHeaders.length).toBe(2);
  });

  it('colunas antigas (SEQ, ZONA, STROKE, ONDE ERROU, SUBTIPO) não existem', () => {
    render(
      <MatchTimelineView
        points={[makePoint({})]}
        player1Name="Ronaldo"
        player2Name="Mateus"
        matchId="match-1"
      />
    );

    expect(screen.queryByText('SEQ', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('ZONA', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('STROKE', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('ONDE ERROU', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('SUBTIPO', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('1ª FALTA', { selector: 'th' })).not.toBeInTheDocument();
    expect(screen.queryByText('2ª FALTA', { selector: 'th' })).not.toBeInTheDocument();
  });

  it('reorganização: legenda explica os códigos para leitor', () => {
    render(
      <MatchTimelineView
        points={[makePoint({})]}
        player1Name="Ronaldo"
        player2Name="Mateus"
        matchId="match-1"
      />
    );

    expect(screen.getByText(/Como ler esta tabela/)).toBeInTheDocument();
    expect(screen.getByText(/1º \/ 2º Saque/)).toBeInTheDocument();
    expect(screen.getByText(/ACE, OUT ou NET/)).toBeInTheDocument();
  });

  // ─── Regressão: correção do warning jsx-a11y/control-has-associated-label ──
  // O <th> "TIPO" tem filhos aninhados (<div><span>TIPO</span><span>ENF, EF,
  // W</span></div>), sem texto direto associável ao elemento — corrigido com
  // aria-label="TIPO (ENF, EF, W)".
  it('cabeçalho TIPO tem aria-label associado (regressão a11y)', () => {
    render(
      <MatchTimelineView
        points={[makePoint({})]}
        player1Name="Ronaldo"
        player2Name="Mateus"
        matchId="match-1"
      />
    );

    expect(screen.getByLabelText('TIPO (ENF, EF, W)', { selector: 'th' })).toBeInTheDocument();
  });
});
