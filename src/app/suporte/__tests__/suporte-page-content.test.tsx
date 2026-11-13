/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';
import SuportePageContent from '../suporte-page-content';
import type { SuporteData, TrainingCenter, UserItem, MembershipItem, ExternosData } from '../types';

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

function makeUser(id: string, extra: Partial<UserItem> = {}): UserItem {
  return {
    id, name: `${id} Pessoa`, email: `${id}@x.com`, cpf: '1', role: 'ANNOTATOR',
    canOperate: false, isActive: true, createdAt: '2026-01-01', ...extra,
  };
}

const externos: ExternosData = {
  athletes: [
    {
      id: 'e1', name: 'Juca Externo', club: 'TCC', city: 'São Paulo', state: 'SP',
      gender: 'MALE', age: 17, rankings: null, createdAt: '2026-01-01T00:00:00.000Z',
      createdByName: 'Ronaldo', createdByEmail: null,
    },
  ],
  clubs: [{ club: 'TCC', city: 'São Paulo', state: 'SP', status: null, inSystem: false }],
  totalAthletes: 1,
  totalClubs: 1,
};

const data: SuporteData = {
  clubs: [makeCt('ct-s', 'Clube Suspenso', 'SUSPENDED'), makeCt('ct-a', 'Clube Ativo', 'ACTIVE')],
  users: [
    makeUser('u1', { name: 'Gestor Uno' }),
    makeUser('u2', { name: 'Ana Avulsa' }),
    makeUser('u3', { name: 'Bruno Avulso' }),
    // Conta de atleta sem clube: entra em "Atletas Avulsos", nunca em espectadores.
    makeUser('u4', { name: 'Caio Atleta', hasPlayer: true, hasPlayerCt: false }),
  ],
  memberships: [
    { id: 'm1', userId: 'u1', kind: 'GESTOR', ctId: 'ct-a', status: 'ACTIVE', createdAt: '2026-01-01' } as MembershipItem,
  ],
  externos,
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
    // O rótulo "Contas Avulsas" também existe na aba de navegação — escopar ao <p> do card
    const cardValue = (label: string) => {
      const card = screen.getByText(label, { selector: 'p' }).closest('div')!;
      return within(card).getByText(/^\d+$/);
    };
    // 2 clubes, 1 gestor, 3 contas avulsas (usuários sem membership), 1 atleta externo
    expect(cardValue('Total de Clubes/CTs')).toHaveTextContent('2');
    expect(cardValue('Total de Gestores')).toHaveTextContent('1');
    expect(cardValue('Contas Avulsas')).toHaveTextContent('3');
    expect(cardValue('Atletas Externos')).toHaveTextContent('1');
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

  it('troca para a aba Contas Avulsas e exibe os cards com a lista movida da aba Externos', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Contas Avulsas' }));

    expect(screen.getByText('Atletas Avulsos')).toBeInTheDocument();
    expect(screen.getByText('Treinadores Avulsos')).toBeInTheDocument();
    expect(screen.getByText('Espectadores Avulsos')).toBeInTheDocument();

    // Conteúdo movido da antiga aba "Externos"
    expect(screen.getByText('Atletas Sem Conta (1)')).toBeInTheDocument();
    expect(screen.getByText('Juca Externo')).toBeInTheDocument();
    expect(screen.getByText('Clubes Mencionados (1)')).toBeInTheDocument();
  });

  it('filtra a lista ao clicar no card Treinadores Avulsos', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Contas Avulsas' }));
    fireEvent.click(screen.getByRole('button', { name: /Treinadores Avulsos/ }));

    expect(screen.getByText('Nenhum treinador avulso encontrado.')).toBeInTheDocument();
    expect(screen.queryByText('Atletas Sem Conta (1)')).not.toBeInTheDocument();
    expect(screen.queryByText('Juca Externo')).not.toBeInTheDocument();
  });

  it('filtra a lista ao clicar no card Espectadores Avulsos', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Contas Avulsas' }));
    fireEvent.click(screen.getByRole('button', { name: /Espectadores Avulsos/ }));

    // u2 e u3 não têm membership; u1 (gestor) e u4 (conta de atleta) ficam de fora
    expect(screen.getByText('Ana Avulsa')).toBeInTheDocument();
    expect(screen.getByText('Bruno Avulso')).toBeInTheDocument();
    expect(screen.queryByText('Gestor Uno')).not.toBeInTheDocument();
    expect(screen.queryByText('Caio Atleta')).not.toBeInTheDocument();
    expect(screen.queryByText('Juca Externo')).not.toBeInTheDocument();
  });

  it('lista conta de atleta sem clube junto do card Atletas Avulsos', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Contas Avulsas' }));

    expect(screen.getByText('Atletas Sem Conta (1)')).toBeInTheDocument();
    expect(screen.getByText('Atletas com conta, sem clube (1)')).toBeInTheDocument();
    expect(screen.getByText('Caio Atleta')).toBeInTheDocument();
    expect(screen.queryByText('Ana Avulsa')).not.toBeInTheDocument();
  });

  it('a antiga ?module=externos abre a aba Contas Avulsas', () => {
    window.history.replaceState({}, '', '/suporte?module=externos');
    renderPage();
    expect(screen.getByText('Atletas Sem Conta (1)')).toBeInTheDocument();
    expect(screen.queryByText('Gestão de Clubes e CTs')).not.toBeInTheDocument();
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
