/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CoachesTable } from '../coaches-table';
import { AthletesTable } from '../athletes-table';
import type { AthleteItem, CoachItem } from '../types';

const toastMock = jest.fn();

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: (...args: unknown[]) => toastMock(...args) }),
}));

const coach: CoachItem = {
  id: 'c-1',
  user: {
    id: 'u-1',
    name: 'Técnico Ana',
    cpf: '52998224725',
    email: 'ana@rkt.com',
    createdAt: '2026-01-10T00:00:00.000Z',
    mustChangePassword: false,
  },
  canInsertAthletes: false,
};

const athlete: AthleteItem = {
  player: {
    id: 'p-1',
    name: 'Marcos',
    cpf: '52998224725',
    email: null,
    birthDate: '1990-07-04T00:00:00.000Z',
    gender: 'MASCULINO',
    dominance: 'DESTRO',
    user: null,
  },
};

function renderCoaches(canInsertAthletes = false) {
  return render(
    <CoachesTable
      coaches={[{ ...coach, canInsertAthletes }]}
      selectedIds={[]}
      onSelectChange={jest.fn()}
      onSelectAll={jest.fn()}
      onCreateCoach={jest.fn()}
      onRefresh={jest.fn()}
    />,
  );
}

function renderAthletes(onRefresh: () => void = jest.fn()) {
  return render(
    <AthletesTable
      athletes={[athlete]}
      selectedIds={[]}
      onSelectChange={jest.fn()}
      onSelectAll={jest.fn()}
      onCreateAthlete={jest.fn()}
      onRefresh={onRefresh}
    />,
  );
}

describe('toasts de ação na área do gestor', () => {
  afterEach(() => {
    delete (global as { fetch?: unknown }).fetch;
    toastMock.mockClear();
  });

  it('confirma a edição do treinador com toast de sucesso', async () => {
    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    renderCoaches();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Técnico Ana Maria' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        type: 'success',
        message: 'Treinador atualizado com sucesso!',
      }),
    );
  });

  it('informa a ativação da permissão de inserir atletas', async () => {
    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    renderCoaches(false);

    fireEvent.click(screen.getByRole('checkbox', { name: /Permitir cadastro de atletas/ }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({ type: 'info', message: 'Permissão ativada' }),
    );
  });

  it('informa a desativação da permissão de inserir atletas', async () => {
    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    renderCoaches(true);

    fireEvent.click(screen.getByRole('checkbox', { name: /Permitir cadastro de atletas/ }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({ type: 'info', message: 'Permissão desativada' }),
    );
  });

  it('confirma a edição do atleta com toast de sucesso', async () => {
    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    renderAthletes();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        type: 'success',
        message: 'Atleta atualizado com sucesso!',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('fecha o modal do atleta mesmo quando o refresh da lista fica pendurado', async () => {
    (global as { fetch?: unknown }).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    // Nunca resolve: simula a lista demorando/hang para garantir que o modal
    // não fique preso esperando o refresh após a gravação.
    renderAthletes(() => new Promise<void>(() => {}));

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith({
        type: 'success',
        message: 'Atleta atualizado com sucesso!',
      }),
    );
  });
});
