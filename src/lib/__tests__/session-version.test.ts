import {
  SESSION_CACHE_TTL_MS,
  invalidateSessionCache,
  isSessionCurrent,
} from '@/lib/session-version.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));

const findUnique = prisma.user.findUnique as unknown as jest.Mock;
const T0 = 1_000_000;

describe('isSessionCurrent', () => {
  beforeEach(() => {
    invalidateSessionCache();
    findUnique.mockReset();
    findUnique.mockResolvedValue({ sessionVersion: 3, isActive: true });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('token legado (sem sv) vale e não consulta o banco', async () => {
    await expect(isSessionCurrent('u1', undefined, T0)).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('sv igual ou maior que o do banco vale; menor é revogado', async () => {
    await expect(isSessionCurrent('u1', 3, T0)).resolves.toBe(true);
    await expect(isSessionCurrent('u1', 4, T0)).resolves.toBe(true);
    invalidateSessionCache('u1');
    await expect(isSessionCurrent('u1', 2, T0)).resolves.toBe(false);
  });

  it('conta inativa ou inexistente é revogada', async () => {
    findUnique.mockResolvedValueOnce({ sessionVersion: 0, isActive: false });
    await expect(isSessionCurrent('u1', 0, T0)).resolves.toBe(false);
    invalidateSessionCache('u1');
    findUnique.mockResolvedValueOnce(null);
    await expect(isSessionCurrent('u1', 0, T0)).resolves.toBe(false);
  });

  it('usa cache dentro do TTL e relê depois dele (revogação ≤ 60 s)', async () => {
    await isSessionCurrent('u1', 3, T0);
    await isSessionCurrent('u1', 3, T0 + SESSION_CACHE_TTL_MS - 1);
    expect(findUnique).toHaveBeenCalledTimes(1);

    findUnique.mockResolvedValue({ sessionVersion: 4, isActive: true });
    await expect(isSessionCurrent('u1', 3, T0 + SESSION_CACHE_TTL_MS - 1)).resolves.toBe(true);
    await expect(isSessionCurrent('u1', 3, T0 + SESSION_CACHE_TTL_MS)).resolves.toBe(false);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('invalidateSessionCache força nova leitura imediatamente', async () => {
    await isSessionCurrent('u1', 3, T0);
    findUnique.mockResolvedValue({ sessionVersion: 9, isActive: true });
    invalidateSessionCache('u1');
    await expect(isSessionCurrent('u1', 3, T0)).resolves.toBe(false);
  });

  it('falha de leitura é fail-open (como antes do recurso existir)', async () => {
    findUnique.mockRejectedValue(new Error('db down'));
    await expect(isSessionCurrent('u1', 3, T0)).resolves.toBe(true);
  });
});
