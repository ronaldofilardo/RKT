/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SpectatorStatusBanner } from '../SpectatorStatusBanner';
import { SpectatorEmptyState } from '../SpectatorEmptyState';

describe('Spectator States (10 Wireframe States)', () => {
  it('renderiza banner NO_SIGNAL com tempo decorrido correto', () => {
    render(<SpectatorStatusBanner kind="NO_SIGNAL" ageSeconds={45} />);
    expect(screen.getByText('Sem atualização há 45 s. O placar pode estar atrasado.')).toBeInTheDocument();
  });

  it('renderiza banner PAUSED com texto exato do wireframe', () => {
    render(<SpectatorStatusBanner kind="PAUSED" />);
    expect(screen.getByText('Pausada pelo anotador. Volta quando retomar.')).toBeInTheDocument();
  });

  it('renderiza banner OFFLINE com horário dos últimos dados', () => {
    const date = new Date(2026, 9, 29, 14, 32, 0);
    render(<SpectatorStatusBanner kind="OFFLINE" lastUpdated={date} />);
    expect(screen.getByText(/Você está sem internet\. Mostrando dados de 14:32/)).toBeInTheDocument();
  });

  it('renderiza empty state NOT_STARTED para partida sem pontos iniciados', () => {
    render(
      <SpectatorEmptyState
        icon="hourglass"
        title="A partida ainda não começou"
        description="Os pontos aparecem aqui assim que o anotador registrar o primeiro."
      />
    );
    expect(screen.getByText('A partida ainda não começou')).toBeInTheDocument();
    expect(screen.getByText('Os pontos aparecem aqui assim que o anotador registrar o primeiro.')).toBeInTheDocument();
  });

  it('renderiza estado de erro 403 ACCESS_REVOKED com botão Voltar ao início', () => {
    render(
      <SpectatorEmptyState
        icon="lock"
        title="Seu acesso foi encerrado"
        description="O dono da partida removeu seu acesso. Peça um novo convite."
        actionText="Voltar ao início"
        actionHref="/dashboard"
      />
    );
    expect(screen.getByText('Seu acesso foi encerrado')).toBeInTheDocument();
    expect(screen.getByText('O dono da partida removeu seu acesso. Peça um novo convite.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/dashboard');
  });

  it('renderiza estado de erro 404 INVITE_INVALID', () => {
    render(
      <SpectatorEmptyState
        icon="link-off"
        title="Convite inválido ou expirado"
        description="Confira o link ou peça um novo ao dono da partida."
        actionText="Voltar ao início"
        actionHref="/dashboard"
      />
    );
    expect(screen.getByText('Convite inválido ou expirado')).toBeInTheDocument();
    expect(screen.getByText('Confira o link ou peça um novo ao dono da partida.')).toBeInTheDocument();
  });

  it('renderiza estado de erro 409 SPECTATOR_LIMIT com botão Tentar de novo', () => {
    const onRetry = jest.fn();
    render(
      <SpectatorEmptyState
        icon="users"
        title="Esta partida está lotada"
        description="Já são 5 pessoas acompanhando. Peça ao dono para liberar uma vaga."
        actionText="Tentar de novo"
        onAction={onRetry}
      />
    );
    expect(screen.getByText('Esta partida está lotada')).toBeInTheDocument();
    expect(screen.getByText('Já são 5 pessoas acompanhando. Peça ao dono para liberar uma vaga.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
