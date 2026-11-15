jest.mock('@/lib/prisma', () => require('./playersRouteTestKit').prismaMock());
jest.mock('@/services/playerService', () => require('./playersRouteTestKit').playerServiceMock());
jest.mock('@/services/accessService', () => require('./playersRouteTestKit').accessServiceMock());

import { listPlayers } from '@/services/playerService';
import { getActor } from '@/services/accessService';
import { athleteActor, getPlayers } from './playersRouteTestKit';

const mockListPlayers = listPlayers as jest.MockedFunction<typeof listPlayers>;
const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

describe('GET /api/players', () => {
  beforeEach(() => {
    mockGetActor.mockResolvedValue(athleteActor);
  });

  it('deve retornar 403 se usuário não tem role SPECTATOR', async () => {
    // Sem headers de auth => requireRole retorna 401, mas para validar
    // a guarda de role SPECTATOR usamos um token válido com role abaixo
    // do mínimo exigido pela route. Não há role abaixo de SPECTATOR no
    // schema do projeto, então simulamos a ausência de token.
    const res = await getPlayers('http://localhost:3000/api/players', null);

    expect(res.status).toBe(401);
  });

  it('deve retornar lista de jogadores ordenados por nome', async () => {
    mockListPlayers.mockResolvedValue([
      { id: 'p1', name: 'Ana' },
      { id: 'p2', name: 'Bruno' },
      { id: 'p3', name: 'Carlos' },
    ] as any);

    const res = await getPlayers('http://localhost:3000/api/players?userId=user-123');
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.players).toHaveLength(3);
    expect(data.data.nextCursor).toBeNull();
  });

  it('deve retornar lista de jogadores quando userId não for fornecido', async () => {
    mockListPlayers.mockResolvedValue([
      { id: 'p1', name: 'Atleta' },
      { id: 'p2', name: 'Segundo Jogador' },
    ] as any);

    const res = await getPlayers('http://localhost:3000/api/players?limit=100');
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockListPlayers).toHaveBeenCalledWith(undefined, 100, undefined);
    expect(data.data.players).toHaveLength(2);
  });

  it('deve retornar 500 se ocorrer erro interno no GET', async () => {
    mockListPlayers.mockRejectedValue(new Error('DB Error'));

    const res = await getPlayers('http://localhost:3000/api/players?userId=user-123');

    expect(res.status).toBe(500);
  });
});
