import { fetchClubs, fetchUsers, fetchMemberships } from '../data-logic';
import { patchUser, patchTrainingCenter } from '../suporte-mutations';

const asFetchMock = () => global.fetch as jest.Mock;

function mockFetchResponse(ok: boolean, payload: unknown = {}) {
  asFetchMock().mockResolvedValue({ ok, json: async () => payload });
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe('data-logic (busca de dados do Painel do Suporte)', () => {
  it('fetchClubs retorna os itens de /api/training-centers', async () => {
    mockFetchResponse(true, { items: [{ id: 'ct1' }] });
    expect(await fetchClubs()).toEqual([{ id: 'ct1' }]);
    expect(asFetchMock()).toHaveBeenCalledWith('/api/training-centers');
  });

  it('fetchUsers retorna os itens de /api/users', async () => {
    mockFetchResponse(true, { items: [{ id: 'u1' }] });
    expect(await fetchUsers()).toEqual([{ id: 'u1' }]);
    expect(asFetchMock()).toHaveBeenCalledWith('/api/users');
  });

  it('fetchMemberships retorna os itens de /api/memberships', async () => {
    mockFetchResponse(true, { items: [{ id: 'm1' }] });
    expect(await fetchMemberships()).toEqual([{ id: 'm1' }]);
    expect(asFetchMock()).toHaveBeenCalledWith('/api/memberships');
  });

  it('retorna lista vazia quando a resposta não é ok', async () => {
    mockFetchResponse(false);
    expect(await fetchClubs()).toEqual([]);
    expect(await fetchUsers()).toEqual([]);
    expect(await fetchMemberships()).toEqual([]);
  });

  it('retorna lista vazia quando o payload não tem items', async () => {
    mockFetchResponse(true, {});
    expect(await fetchClubs()).toEqual([]);
  });
});

describe('suporte-mutations (ações do Painel do Suporte)', () => {
  it('patchUser envia PATCH JSON para /api/users/{id}', async () => {
    mockFetchResponse(true);
    await patchUser('u1', { name: 'Novo Nome' });

    expect(asFetchMock()).toHaveBeenCalledWith('/api/users/u1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Novo Nome' }),
    });
  });

  it('patchUser lança erro quando a resposta não é ok', async () => {
    mockFetchResponse(false);
    await expect(patchUser('u1', {})).rejects.toThrow('Falha ao atualizar usuário');
  });

  it('patchTrainingCenter envia PATCH JSON para /api/training-centers/{id}', async () => {
    mockFetchResponse(true);
    await patchTrainingCenter('ct1', { status: 'ACTIVE' });

    expect(asFetchMock()).toHaveBeenCalledWith('/api/training-centers/ct1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
  });

  it('patchTrainingCenter lança erro quando a resposta não é ok', async () => {
    mockFetchResponse(false);
    await expect(patchTrainingCenter('ct1', {})).rejects.toThrow('Falha ao atualizar clube');
  });
});
