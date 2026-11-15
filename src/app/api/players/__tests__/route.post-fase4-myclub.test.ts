jest.mock('@/lib/prisma', () => require('./playersRouteTestKit').prismaMock());
jest.mock('@/services/playerService', () => require('./playersRouteTestKit').playerServiceMock());
jest.mock('@/services/accessService', () => require('./playersRouteTestKit').accessServiceMock());

import { createPlayer } from '@/services/playerService';
import { getActor } from '@/services/accessService';
import { atletaActor, createdPlayer, defaultActor, gestorActor, postPlayers } from './playersRouteTestKit';

const mockCreatePlayer = createPlayer as jest.MockedFunction<typeof createPlayer>;
const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

describe('POST /api/players - Fase 4 (cpf, myClub, ctId, athleteCode) - myClub', () => {
  beforeEach(() => {
    mockGetActor.mockResolvedValue(defaultActor);
  });

  it('com myClub=true e ator sem CTs deve retornar 403', async () => {
    const res = await postPlayers({ name: 'Test', myClub: true });

    expect(res.status).toBe(403);
    expect(mockCreatePlayer).not.toHaveBeenCalled();
  });

  it('com myClub=true e ator com 2+ CTs sem ctId deve retornar 400', async () => {
    mockGetActor.mockResolvedValue({
      ...defaultActor,
      memberships: [
        { kind: 'GESTOR', preset: null, ctId: 'ct-1', status: 'ACTIVE' },
        { kind: 'TREINADOR', preset: null, ctId: 'ct-2', status: 'ACTIVE' },
      ],
    });

    const res = await postPlayers({ name: 'Test', myClub: true });

    expect(res.status).toBe(400);
    expect(mockCreatePlayer).not.toHaveBeenCalled();
  });

  it('com myClub=true e GESTOR passa ctId e actorProfile GESTOR', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayer());
    mockGetActor.mockResolvedValue(gestorActor);

    const res = await postPlayers({ name: 'Test', myClub: true, ctId: 'ct-1' });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ myClub: true, ctId: 'ct-1', actorProfile: 'GESTOR' }),
    );
  });

  it('quando GESTOR cria atleta sem myClub, NÃO vincula ao CT do ator', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayer());
    mockGetActor.mockResolvedValue(gestorActor);

    const res = await postPlayers({ name: 'Adversario de outro clube' });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ myClub: false, ctId: null }),
    );
  });

  it('com myClub=true e ATLETA passa actorProfile ATLETA', async () => {
    mockCreatePlayer.mockResolvedValue(createdPlayer());
    mockGetActor.mockResolvedValue(atletaActor);

    const res = await postPlayers({ name: 'Test', myClub: true, ctId: 'ct-1' });

    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({ actorProfile: 'ATLETA' }),
    );
  });
});
