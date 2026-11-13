import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

const mockPrisma = {
  passwordResetRequest: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

let POST: (req: NextRequest) => Promise<Response>;

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();

  mockPrisma.passwordResetRequest.findFirst.mockReset();
  mockPrisma.passwordResetRequest.update.mockReset();
  mockPrisma.user.update.mockReset();
  mockPrisma.$transaction.mockReset();

  mockPrisma.user.update.mockResolvedValue({});
  mockPrisma.passwordResetRequest.update.mockResolvedValue({});
  mockPrisma.$transaction.mockResolvedValue(undefined);

  jest.doMock('@/lib/prisma', () => ({ prisma: mockPrisma }));
  const mod = await import('../route');
  POST = mod.POST;
});

describe('POST /api/auth/reset-password', () => {
  it('retorna 400 para payload inválido', async () => {
    const res = await POST(makeReq({ token: 'abc', password: 'curta' }));
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('retorna 400 INVALID_TOKEN quando o token não existe/expirou', async () => {
    mockPrisma.passwordResetRequest.findFirst.mockResolvedValue(null);

    const res = await POST(makeReq({ token: 'token-inexistente-123', password: 'senha1234' }));
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('INVALID_TOKEN');
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockPrisma.passwordResetRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tokenHash: createHash('sha256').update('token-inexistente-123').digest('hex'),
          status: 'LINK_ISSUED',
        }),
      }),
    );
  });

  // Regressão: o redefinir via token limpava apenas passwordHash, deixando
  // mustChangePassword=true e o atleta preso em loop do /trocar-senha.
  it('redefine a senha e limpa mustChangePassword/tempPasswordExpiresAt', async () => {
    const reset = { id: 'reset-1', userId: 'user-1' };
    mockPrisma.passwordResetRequest.findFirst.mockResolvedValue(reset);

    const res = await POST(makeReq({ token: 'token-valido-123456', password: 'NovaSenha123' }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.message).toBe('Senha redefinida.');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        passwordHash: expect.any(String),
        mustChangePassword: false,
        tempPasswordExpiresAt: null,
        sessionVersion: { increment: 1 },
      },
    });

    const savedHash = mockPrisma.user.update.mock.calls[0][0].data.passwordHash;
    expect(await bcrypt.compare('NovaSenha123', savedHash)).toBe(true);

    expect(mockPrisma.passwordResetRequest.update).toHaveBeenCalledWith({
      where: { id: 'reset-1' },
      data: { status: 'DONE', doneAt: expect.any(Date) },
    });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('limpa os cookies de sessão na resposta', async () => {
    mockPrisma.passwordResetRequest.findFirst.mockResolvedValue({ id: 'reset-1', userId: 'user-1' });

    const res = await POST(makeReq({ token: 'token-valido-123456', password: 'NovaSenha123' }));
    expect(res.status).toBe(200);

    const cookies = res.headers.getSetCookie().map((c) => c.split('=')[0]);
    expect(cookies).toEqual(
      expect.arrayContaining(['rkt_access_token', 'access_token', 'user_role']),
    );
    for (const c of res.headers.getSetCookie()) {
      expect(c).toContain('Max-Age=0');
    }
  });
});
