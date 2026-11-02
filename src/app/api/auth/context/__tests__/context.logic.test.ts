import { switchUserContext } from '../context.logic';
import { prisma } from '@/lib/prisma';
import { resolveAvailableContexts } from '../../login/login-contexts.logic';
import { getActor } from '@/services/accessService';
import { generateLoginToken } from '../../login/login-token-logic';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  },
}));

jest.mock('../../login/login-contexts.logic', () => ({
  resolveAvailableContexts: jest.fn(),
}));

jest.mock('@/services/accessService', () => ({
  getActor: jest.fn(),
}));

jest.mock('../../login/login-token-logic', () => ({
  generateLoginToken: jest.fn(),
}));

describe('switchUserContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna CONTEXT_NOT_ALLOWED quando o targetContextId não está nos contextos disponíveis', async () => {
    (resolveAvailableContexts as jest.Mock).mockResolvedValue([
      { id: 'ct-1', label: 'CT 1', role: 'TREINADOR', type: 'CT' },
    ]);

    const result = await switchUserContext('u1', 'PARTICULAR');
    expect(result.success).toBe(false);
    expect(result.error).toBe('CONTEXT_NOT_ALLOWED');
  });

  it('retorna targetUrl /treinador e gera token com TREINADOR_AVULSO para PARTICULAR', async () => {
    (resolveAvailableContexts as jest.Mock).mockResolvedValue([
      { id: 'ct-1', label: 'CT 1', role: 'TREINADOR', type: 'CT' },
      { id: 'PARTICULAR', label: 'Particular', role: 'TREINADOR', type: 'PARTICULAR' },
    ]);

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: 'ANNOTATOR',
      sessionVersion: 1,
      mustChangePassword: false,
    });

    (getActor as jest.Mock).mockResolvedValue({
      userId: 'u1',
      memberships: [{ kind: 'TREINADOR', ctId: null, status: 'ACTIVE' }],
    });

    (generateLoginToken as jest.Mock).mockResolvedValue('jwt-particular');

    const result = await switchUserContext('u1', 'PARTICULAR');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.accessToken).toBe('jwt-particular');
      expect(result.targetUrl).toBe('/treinador');
    }

    expect(generateLoginToken).toHaveBeenCalledWith(
      'u1',
      'ANNOTATOR',
      1,
      false,
      null,
      'TREINADOR',
      'PARTICULAR',
      'TREINADOR_AVULSO',
      undefined,
    );
  });

  it('retorna targetUrl /clube/treinador e gera token com TREINADOR_CLUBE para CT', async () => {
    (resolveAvailableContexts as jest.Mock).mockResolvedValue([
      { id: 'ct-1', label: 'CT 1', role: 'TREINADOR', type: 'CT' },
    ]);

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      role: 'ANNOTATOR',
      sessionVersion: 1,
      mustChangePassword: false,
    });

    (getActor as jest.Mock).mockResolvedValue({
      userId: 'u1',
      memberships: [{ kind: 'TREINADOR', ctId: 'ct-1', status: 'ACTIVE' }],
    });

    (generateLoginToken as jest.Mock).mockResolvedValue('jwt-ct');

    const result = await switchUserContext('u1', 'ct-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.accessToken).toBe('jwt-ct');
      expect(result.targetUrl).toBe('/clube/treinador');
    }

    expect(generateLoginToken).toHaveBeenCalledWith(
      'u1',
      'ANNOTATOR',
      1,
      false,
      null,
      'TREINADOR',
      'ct-1',
      'TREINADOR_CLUBE',
      'ct-1',
    );
  });
});
