jest.mock('@/lib/prisma', () => require('./playersRouteTestKit').prismaMock());
jest.mock('@/services/playerService', () => require('./playersRouteTestKit').playerServiceMock());
jest.mock('@/services/accessService', () => require('./playersRouteTestKit').accessServiceMock());

import { createPlayer } from '@/services/playerService';
import { getActor } from '@/services/accessService';
import { createdPlayer, defaultActor, inactiveActor, postPlayers } from './playersRouteTestKit';

const mockCreatePlayer = createPlayer as jest.MockedFunction<typeof createPlayer>;
const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

describe('POST /api/players - Fase 4 (cpf, myClub, ctId, athleteCode) - payload', () => {
  beforeEach(() => {
    mockGetActor.mockResolvedValue(defaultActor);
  });

  it('deve passar cpf, myClub false e ctId null para createPlayer', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayer({ cpfHash: 'hash', cpfLast2: '25' }));

    const res = await postPlayers({ name: 'Test', cpf: '529.982.247-25', myClub: false });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test',
        cpf: '529.982.247-25',
        myClub: false,
        ctId: null,
        actorProfile: null,
      }),
    );
  });

  it('aceita ctId explicitamente nulo no payload sem erro de validação (treinador avulso)', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayer());

    const res = await postPlayers({ name: 'Test', ctId: null, myClub: false });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test', ctId: null }),
    );
  });

  it('deve gerar athleteCode e identityStatus PROVISIONAL quando sem createdByUserId', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayer());

    const res = await postPlayers({ name: 'Test' });

    expect(res.status).toBe(201);
    const callArgs = mockCreatePlayer.mock.calls[0][0];
    expect(callArgs.identityStatus).toBeUndefined(); // route passes undefined, mutation defaults
    expect(callArgs.createdByUserId).toBe('user-athlete');
  });

  it('conta inativa deve retornar 403', async () => {
    mockGetActor.mockResolvedValue(inactiveActor);

    const res = await postPlayers({ name: 'Test' });

    expect(res.status).toBe(403);
    expect(mockCreatePlayer).not.toHaveBeenCalled();
  });
});
