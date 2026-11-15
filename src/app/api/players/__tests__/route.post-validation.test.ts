jest.mock('@/lib/prisma', () => require('./playersRouteTestKit').prismaMock());
jest.mock('@/services/playerService', () => require('./playersRouteTestKit').playerServiceMock());
jest.mock('@/services/accessService', () => require('./playersRouteTestKit').accessServiceMock());

import { getActor } from '@/services/accessService';
import { defaultActor, postPlayers } from './playersRouteTestKit';

const mockGetActor = getActor as jest.MockedFunction<typeof getActor>;

describe('POST /api/players - validação', () => {
  beforeEach(() => {
    mockGetActor.mockResolvedValue(defaultActor);
  });

  it.each([
    ['nome tem menos de 2 chars', { name: 'A' }],
    ['age é maior que 120', { name: 'Test', age: 121 }],
  ])('deve retornar 400 se %s', async (_label, body) => {
    const res = await postPlayers(body);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 400 se nome está ausente', async () => {
    const res = await postPlayers({});

    expect(res.status).toBe(400);
  });

  it.each([
    ['gender é inválido', { name: 'Test', gender: 'INVALID' }, 'gender'],
    ['age é inválido (menor que 1)', { name: 'Test', age: 0 }, 'age'],
    ['dominance é inválido', { name: 'Test', dominance: 'INVALID' }, 'dominance'],
    ['backhand é inválido', { name: 'Test', backhand: 'INVALID' }, 'backhand'],
    ['rankings não é um objeto', { name: 'Test', rankings: ['ESTADUAL'] }, 'rankings'],
    ['rankings tem tipo inválido', { name: 'Test', rankings: { INVALID: { position: 1 } } }, 'rankings'],
    ['ranking position não é número positivo', { name: 'Test', rankings: { ESTADUAL: { position: 0 } } }, 'rankings'],
    ['ranking entry não é objeto', { name: 'Test', rankings: { ESTADUAL: 5 } }, 'rankings'],
  ])('deve retornar 400 se %s', async (_label, body, detail) => {
    const res = await postPlayers(body);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain(detail);
  });
});
