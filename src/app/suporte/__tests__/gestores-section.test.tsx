/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '@/components/Toast';
import { GestoresSection } from '../gestores-section';
import type { MembershipItem, UserItem, TrainingCenter } from '../types';

function makeUser(overrides: Partial<UserItem> = {}): UserItem {
  return {
    id: 'u1', name: 'Eduardo Gestor', email: 'eduardo@x.com', cpf: '12345678901',
    role: 'GESTOR', canOperate: true, isActive: true, createdAt: '2026-01-01',
    ...overrides,
  };
}

function makeMembership(overrides: Partial<MembershipItem> = {}): MembershipItem {
  return {
    id: 'm1', userId: 'u1', kind: 'GESTOR', ctId: 'ct1', status: 'ACTIVE', createdAt: '2026-01-01',
    ...overrides,
  };
}

const club: TrainingCenter = {
  id: 'ct1', name: 'CT Teste', slug: 'ct-teste', status: 'ACTIVE', cnpj: null, legalName: null,
  phone: null, email: null, address: null, legalRepName: null, legalRepCpf: null,
  legalRepEmail: null, legalRepPhone: null,
};

function renderSection(memberships: MembershipItem[], users: UserItem[]) {
  return render(
    <ToastProvider>
      <GestoresSection memberships={memberships} users={users} clubs={[club]} onEdit={jest.fn()} onRefresh={jest.fn()} />
    </ToastProvider>
  );
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch;
  jest.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('GestoresSection (aba Gestores)', () => {
  it('lista apenas membros GESTOR, com CPF formatado e badge de status', () => {
    renderSection(
      [makeMembership(), makeMembership({ id: 'm2', userId: 'u2', kind: 'ATLETA_CLUBE' })],
      [makeUser(), makeUser({ id: 'u2', name: 'Atleta Não Listado' })]
    );

    expect(screen.getByText('Eduardo Gestor')).toBeInTheDocument();
    expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.queryByText('Atleta Não Listado')).not.toBeInTheDocument();
  });

  it('exibe "Clube não vinculado" para membership sem ctId e "Suspenso" para suspensa', () => {
    renderSection(
      [makeMembership({ ctId: null, status: 'SUSPENDED' })],
      [makeUser()]
    );

    expect(screen.getByText('Clube não vinculado')).toBeInTheDocument();
    expect(screen.getByText('Suspenso')).toBeInTheDocument();
  });

  it('gera link de senha via POST e abre o modal de link', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true, json: async () => ({ token: 'tok123', expiresAt: '2026-11-01T00:00:00Z' }),
    });
    renderSection([makeMembership()], [makeUser()]);

    fireEvent.click(screen.getByRole('button', { name: 'Link Senha' }));

    expect(await screen.findByText('Link de Redefinição de Senha')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/support/password-resets', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ userId: 'u1' }),
    }));
  });

  it('derruba todas as sessões após confirmação', async () => {
    renderSection([makeMembership()], [makeUser()]);

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar Sessões' }));

    expect(window.confirm).toHaveBeenCalledWith('Deseja derrubar todas as sessões ativas de Eduardo Gestor?');
    expect(await screen.findByText(/foram revogadas com sucesso/)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/users/u1/revoke-sessions', { method: 'POST' });
  });

  it('não derruba sessões quando o usuário cancela a confirmação', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    renderSection([makeMembership()], [makeUser()]);

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar Sessões' }));

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalledWith('/api/users/u1/revoke-sessions', { method: 'POST' });
  });

  it('exibe estado vazio quando não há gestores', () => {
    renderSection([], []);
    expect(screen.getByText('Nenhum gestor cadastrado na plataforma.')).toBeInTheDocument();
  });
});
