/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';
import SuportePageContent from '../suporte-page-content';
import type { SuporteData, TrainingCenter, UserItem, MembershipItem } from '../types';

const mockChrome = jest.fn();
jest.mock('@/app/dashboard/components/DashboardChrome', () => ({
  DashboardChrome: (props: Record<string, unknown>) => { mockChrome(props); return <header data-testid="chrome" />; },
}));

function makeCt(id: string, name: string, status: string): TrainingCenter {
  return {
    id, name, slug: id, status, cnpj: null, legalName: null, phone: null, email: null,
    address: null, legalRepName: null, legalRepCpf: null, legalRepEmail: null, legalRepPhone: null,
  };
}

function makeUser(id: string, name: string): UserItem {
  return { id, name, email: `${id}@x.com`, cpf: '1', role: 'ATLETA_AVULSO', canOperate: false, isActive: true, createdAt: '2026-01-01' };
}

const data: SuporteData = {
  clubs: [makeCt('ct-p', 'Clube Pendente', 'PENDING'), makeCt('ct-a', 'Clube Ativo', 'ACTIVE')],
  users: [makeUser('u1', 'Gestor Uno'), makeUser('u2', 'Ana Avulsa'), makeUser('u3', 'Bruno Avulso'), makeUser('u4', 'Caio Avulso')],
  memberships: [
    { id: 'm1', userId: 'u1', kind: 'GESTOR', ctId: 'ct-a', status: 'ACTIVE', createdAt: '2026-01-01' } as MembershipItem,
  ],
};

function renderPage(overrides: Record<string, unknown> = {}) {
  return render(
    <ToastProvider>
      <SuportePageContent data={data} loading={false} error={null} setError={jest.fn()} onRetry={jest.fn()} {...overrides} />
    </ToastProvider>
  );
}

afterEach(() => {
  window.history.replaceState({}, '', '/suporte');
});

describe('SuportePageContent (página do Painel do Suporte)', () => {
  it('renderiza o chrome com o título "Painel do Suporte"', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Painel do Suporte' })).toBeInTheDocument();
    await waitFor(() => expect(mockChrome).toHaveBeenCalledWith(expect.objectContaining({ title: 'Painel do Suporte' })));
  });

  it('exibe os cards de estatísticas com as contagens corretas', () => {
    renderPage();
    expect(screen.getByText('Total de Clubes/CTs')).toBeInTheDocument();
    expect(screen.getByText('Total de Gestores')).toBeInTheDocument();
    // O rótulo "Contas Avulsas" também existe na aba de navegação — escopar ao <p> do card
    expect(screen.getByText('Contas Avulsas', { selector: 'p' })).toBeInTheDocument();
    // 2 clubes, 1 gestor, 3 contas avulsas (usuários sem membership)
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('abre por padrão a aba Clubes e CTs', () => {
    renderPage();
    expect(screen.getByText('Gestão de Clubes e CTs')).toBeInTheDocument();
    expect(screen.queryByText('Gestão de Gestores')).not.toBeInTheDocument();
  });

  it('troca para a aba Gestores ao clicar', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Gestores' }));
    expect(screen.getByText('Gestão de Gestores')).toBeInTheDocument();
    expect(screen.queryByText('Gestão de Clubes e CTs')).not.toBeInTheDocument();
  });

  it('troca para a aba Contas Avulsas e exibe os cards', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Contas Avulsas' }));
    expect(screen.getByText('Atletas Avulsos')).toBeInTheDocument();
    expect(screen.getByText('Treinadores Avulsos')).toBeInTheDocument();
    expect(screen.getByText('Espectadores Avulsos')).toBeInTheDocument();
  });

  it('abre o módulo indicado no parâmetro ?module= da URL', () => {
    window.history.replaceState({}, '', '/suporte?module=gestores');
    renderPage();
    expect(screen.getByText('Gestão de Gestores')).toBeInTheDocument();
    expect(screen.queryByText('Gestão de Clubes e CTs')).not.toBeInTheDocument();
  });

  it('mostra o estado de carregamento', () => {
    const { container } = renderPage({ loading: true, data: null });
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('mostra o estado de erro com mensagem', () => {
    renderPage({ error: 'Falha ao carregar', data: null });
    expect(screen.getByText('Erro')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
  });
});
