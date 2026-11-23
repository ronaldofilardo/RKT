import {
  checkLoginRateLimit,
  recordLoginAttempt,
  isLoginRateLimitEnabled,
  MAX_LOGIN_ATTEMPTS,
  RETRY_AFTER_SECONDS,
} from '../login-ratelimit.logic';
import { prisma } from '@/lib/prisma';
import { RateLimitError } from '@/lib/errors';
import { reportApiError } from '@/lib/api-response.logic';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    loginAttempt: {
      count: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'att-1' }),
    },
  },
}));

describe('login-ratelimit.logic', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isLoginRateLimitEnabled', () => {
    it('retorna false se DISABLE_LOGIN_RATELIMIT for true', () => {
      process.env.DISABLE_LOGIN_RATELIMIT = 'true';
      expect(isLoginRateLimitEnabled()).toBe(false);
    });

    it('retorna true quando em teste com ENABLE_LOGIN_RATELIMIT=true', () => {
      process.env.NODE_ENV = 'test';
      process.env.ENABLE_LOGIN_RATELIMIT = 'true';
      expect(isLoginRateLimitEnabled()).toBe(true);
    });

    it('retorna true em producao por padrão', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_LOGIN_RATELIMIT;
      delete process.env.DISABLE_LOGIN_RATELIMIT;
      expect(isLoginRateLimitEnabled()).toBe(true);
    });
  });

  describe('checkLoginRateLimit', () => {
    it('permite requisição quando tentativas falhas são inferiores a MAX_LOGIN_ATTEMPTS', async () => {
      process.env.ENABLE_LOGIN_RATELIMIT = 'true';
      (prisma.loginAttempt.count as jest.Mock).mockResolvedValue(2);

      await expect(checkLoginRateLimit('127.0.0.1')).resolves.toBeUndefined();
    });

    it('bloqueia e lança RateLimitError (429) quando tentativas falhas >= MAX_LOGIN_ATTEMPTS', async () => {
      process.env.ENABLE_LOGIN_RATELIMIT = 'true';
      (prisma.loginAttempt.count as jest.Mock).mockResolvedValue(MAX_LOGIN_ATTEMPTS);

      await expect(checkLoginRateLimit('10.0.0.1')).rejects.toThrow(RateLimitError);

      try {
        await checkLoginRateLimit('10.0.0.1');
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitError);
        const rateErr = err as RateLimitError;
        expect(rateErr.status).toBe(429);
        expect(rateErr.retryAfterSeconds).toBe(RETRY_AFTER_SECONDS);

        const response = reportApiError(rateErr);
        expect(response.status).toBe(429);
        expect(response.headers.get('Retry-After')).toBe(String(RETRY_AFTER_SECONDS));
      }
    });
  });

  describe('recordLoginAttempt', () => {
    it('registra tentativa no banco quando rate limit está habilitado', async () => {
      process.env.ENABLE_LOGIN_RATELIMIT = 'true';

      await recordLoginAttempt('127.0.0.1', 'user@test.com', false);

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: {
          ip: '127.0.0.1',
          cpf: 'user@test.com',
          success: false,
        },
      });
    });
  });
});
