jest.mock('@/lib/prisma', () => require('./playersRouteTestKit').prismaMock());
jest.mock('@/services/playerService', () => require('./playersRouteTestKit').playerServiceMock());
jest.mock('@/services/accessService', () => require('./playersRouteTestKit').accessServiceMock());

import { createPlayer } from '@/services/playerService';
import { getActor } from '@/services/accessService';
import { defaultActor, postPlayers } from './playersRouteTestKit';

const mockCreatePlayer = createPlayer as jest.MockedFunction<typeof createPlayer>;
const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

describe('POST /api/players - criação', () => {
  beforeEach(() => {
    mockGetActor.mockResolvedValue(defaultActor);
  });

  it('deve criar jogador com rankings', async () => {
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Novo Jogador',
      gender: 'MALE',
      age: 25,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
    });

    const res = await postPlayers({
      name: 'Novo Jogador',
      gender: 'MALE',
      age: 25,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.data.name).toBe('Novo Jogador');
    expect(data.data.rankings).toEqual({ ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } });
  });

  it('deve aceitar POST de ADMIN (ADMIN >= ANNOTATOR)', async () => {
    // ADMIN tem role superior a ANNOTATOR, então pode acessar endpoints de ANNOTATOR
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Teste',
      gender: null,
      age: null,
      birthDate: null,
      dominance: null,
      backhand: null,
      ranking: null,
      rankings: null,
      club: null,
    });

    const res = await postPlayers({ name: 'Teste' }, 'ADMIN');

    expect(res.status).toBe(201);
  });

  it('deve retornar 500 se ocorrer erro interno', async () => {
    mockCreatePlayer.mockRejectedValue(new Error('DB Error'));

    const res = await postPlayers({ name: 'Jogador' });

    expect(res.status).toBe(500);
  });
});
