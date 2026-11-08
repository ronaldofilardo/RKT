/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { DashboardEmptyState } from '../components/dashboard-empty-state';
import {
  resolveDashboardEmptyHref,
  resolveDashboardEmptyProfile,
} from '../components/dashboard-empty-state.logic';

describe('resolveDashboardEmptyProfile', () => {
  it.each([
    ['ATLETA', 'ATHLETE'],
    ['TREINADOR_CLUBE', 'COACH'],
    ['TREINADOR_AVULSO', 'COACH'],
    ['GESTOR', 'MANAGER'],
    ['ESPECTADOR', 'SPECTATOR'],
  ])('mapeia a área %s para o perfil %s', (area, profile) => {
    expect(resolveDashboardEmptyProfile(area)).toBe(profile);
  });

  it('retorna null para áreas sem empty state dedicado', () => {
    expect(resolveDashboardEmptyProfile('ANOTADOR')).toBeNull();
    expect(resolveDashboardEmptyProfile('ADMIN')).toBeNull();
    expect(resolveDashboardEmptyProfile(null)).toBeNull();
  });
});

describe('resolveDashboardEmptyHref', () => {
  it('prefixa os hrefs com a área ativa', () => {
    expect(resolveDashboardEmptyHref('/match/new', 'ATLETA')).toBe('/atleta/match/new');
    expect(resolveDashboardEmptyHref('/atletas', 'TREINADOR_CLUBE')).toBe('/clube/treinador/atletas');
    expect(resolveDashboardEmptyHref('/atletas', 'TREINADOR_AVULSO')).toBe('/treinador/atletas');
  });

  it('usa a home do gestor preservando a aba', () => {
    expect(resolveDashboardEmptyHref('/gestor?tab=coaches', 'GESTOR')).toBe('/clube/gestor?tab=coaches');
    expect(resolveDashboardEmptyHref('/gestor?tab=athletes', 'GESTOR')).toBe('/clube/gestor?tab=athletes');
  });

  it('mantém a rota quando não há área ativa', () => {
    expect(resolveDashboardEmptyHref('/gestor?tab=coaches', null)).toBe('/gestor?tab=coaches');
  });
});

describe('DashboardEmptyState', () => {
  it('renderiza o conteúdo do atleta com CTA para a nova partida da área', () => {
    render(<DashboardEmptyState activeArea="ATLETA" />);

    expect(screen.getByText('Bem-vindo à sua central de telemetria')).toBeInTheDocument();
    expect(screen.getByText('Você ainda não possui partidas registradas no seu histórico.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Criar Minha Primeira Partida/ })).toHaveAttribute(
      'href',
      '/atleta/match/new',
    );
    expect(screen.getByText(/índice de pressão, saque e momentum/)).toBeInTheDocument();
  });

  it('renderiza dois CTAs para o treinador', () => {
    render(<DashboardEmptyState activeArea="TREINADOR_CLUBE" />);

    expect(screen.getByText('Pronto para iniciar os treinos e anotações?')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Nova Partida/ })).toHaveAttribute(
      'href',
      '/clube/treinador/match/new',
    );
    expect(screen.getByRole('link', { name: /Cadastrar Atleta/ })).toHaveAttribute(
      'href',
      '/clube/treinador/atletas',
    );
  });

  it('aponta os CTAs do gestor para as abas de treinadores e atletas', () => {
    render(<DashboardEmptyState activeArea="GESTOR" />);

    expect(screen.getByText('Seu Centro de Treinamento está pronto')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cadastrar Treinadores/ })).toHaveAttribute(
      'href',
      '/clube/gestor?tab=coaches',
    );
    expect(screen.getByRole('link', { name: /Cadastrar Atletas/ })).toHaveAttribute(
      'href',
      '/clube/gestor?tab=athletes',
    );
  });

  it('renderiza o conteúdo do espectador', () => {
    render(<DashboardEmptyState activeArea="ESPECTADOR" />);

    expect(screen.getByText('Acompanhe seus jogos favoritos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Anotar uma Partida/ })).toHaveAttribute(
      'href',
      '/espectador/match/new',
    );
    expect(screen.getByText(/link de transmissão de uma partida ao vivo/)).toBeInTheDocument();
  });

  it('mantém a mensagem genérica quando não há perfil dedicado', () => {
    render(<DashboardEmptyState activeArea="ANOTADOR" />);

    expect(screen.getByText('Nenhuma partida por aqui ainda.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
