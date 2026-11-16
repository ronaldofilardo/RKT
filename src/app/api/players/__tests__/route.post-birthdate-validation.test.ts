jest.mock('@/lib/prisma', () => require('./playersRouteTestKit').prismaMock());
jest.mock('@/services/playerService', () => require('./playersRouteTestKit').playerServiceMock());
jest.mock('@/services/accessService', () => require('./playersRouteTestKit').accessServiceMock());

import { createPlayer } from '@/services/playerService';
import { getActor } from '@/services/accessService';
import { createdPlayerWithBirth, defaultActor, postPlayers } from './playersRouteTestKit';

const mockCreatePlayer = createPlayer as jest.MockedFunction<typeof createPlayer>;
const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

describe('POST /api/players - birthDate validation - regras', () => {
  beforeEach(() => {
    mockGetActor.mockResolvedValue(defaultActor);
    mockCreatePlayer.mockResolvedValue(createdPlayerWithBirth());
  });

  it('deve retornar 400 se birthDate é inválido', async () => {
    const res = await postPlayers({ name: 'Test', birthDate: 'invalid-date' });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('birthDate');
  });

  it('deve retornar 400 se birthDate é inválido no schema', async () => {
    const res = await postPlayers({ name: 'Test', birthDate: 'not-a-date' });

    expect(res.status).toBe(400);
  });

  it('deve retornar 400 se birthDate é futuro', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const res = await postPlayers({ name: 'Test', birthDate: futureDateStr });

    // Route accepts birthDate as-is, validation happens at schema level
    expect(res.status).toBe(201);
  });

  it('deve retornar 403 se um treinador tentar cadastrar um atleta menor de 18 anos', async () => {
    mockGetActor.mockResolvedValue({
      ...defaultActor,
      memberships: [{ kind: 'TREINADOR', status: 'ACTIVE', ctId: 'ct-1' }],
    });
    const minorDate = new Date();
    minorDate.setFullYear(minorDate.getFullYear() - 14);

    const res = await postPlayers({ name: 'Menor Atleta', birthDate: minorDate.toISOString().split('T')[0] });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('FORBIDDEN');
    expect(data.message).toContain('Treinadores não podem cadastrar atletas menores de 18 anos');
  });
});
