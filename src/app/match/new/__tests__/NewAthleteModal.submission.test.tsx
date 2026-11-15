/**
 * @jest-environment jsdom
 */
// Divisão de NewAthleteModal.characterization.test.tsx (381L) — submissão.
// Kit compartilhado: newAthleteModalTestKit.tsx.
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { fillFormForSubmit, installFetchMock, seedSessionStorage, setupModal } from './newAthleteModalTestKit';

const mockFetch = installFetchMock();

describe('NewAthleteModal — submissão do formulário', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    seedSessionStorage();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'p1', name: 'João Silva', gender: 'MALE', age: 20 } }),
    });
  });

  it('calls API with correct payload on submit', async () => {
    setupModal();
    fillFormForSubmit('João Silva');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe('/api/players');
    const body = JSON.parse(call[1].body);
    expect(body.name).toBe('João Silva');
    expect(body.gender).toBe('MALE');
  });

  it('shows error message on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Nome já cadastrado' }),
    });

    setupModal();
    fillFormForSubmit('João Silva');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
    await waitFor(() => expect(screen.getByText('Nome já cadastrado')).toBeInTheDocument());
  });

  it('shows error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    setupModal();
    fillFormForSubmit('João Silva');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument());
  });

  it('does not submit if name is empty', () => {
    setupModal();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
