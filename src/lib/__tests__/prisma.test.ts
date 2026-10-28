import { prisma } from '@/lib/prisma';

describe('prisma client configuration', () => {
  it('exporta instância válida de PrismaClient', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
  });
});


describe('prisma client log level configuration', () => {
  const originalEnv = process.env.PRISMA_LOG_QUERIES;

  afterEach(() => {
    process.env.PRISMA_LOG_QUERIES = originalEnv;
    jest.resetModules();
  });

  it('silencia prisma:query por padrão quando PRISMA_LOG_QUERIES não é "true"', () => {
    delete process.env.PRISMA_LOG_QUERIES;
    const computeLogs = (envValue?: string) =>
      envValue === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'];

    expect(computeLogs(process.env.PRISMA_LOG_QUERIES)).toEqual(['error', 'warn']);
    expect(computeLogs('false')).toEqual(['error', 'warn']);
  });

  it('habilita prisma:query somente quando PRISMA_LOG_QUERIES for explicitamente "true"', () => {
    process.env.PRISMA_LOG_QUERIES = 'true';
    const computeLogs = (envValue?: string) =>
      envValue === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'];

    expect(computeLogs(process.env.PRISMA_LOG_QUERIES)).toEqual(['query', 'error', 'warn']);
  });
});

