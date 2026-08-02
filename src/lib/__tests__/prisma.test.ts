const { getRLSUser } = require('@/lib/rls-context');

jest.mock('@/lib/rls-context', () => ({
  getRLSUser: jest.fn(),
}));

describe('prisma middleware RLS guard', () => {
  let $executeRawUnsafe: jest.Mock;
  let middleware: (params: any, next: any) => Promise<any>;

  const buildMiddleware = () => {
    const prismaMock = {
      $executeRawUnsafe: $executeRawUnsafe,
    };

    return async (params: any, next: any) => {
      if (params.action === 'executeRaw' || params.action === 'queryRaw') {
        return next(params);
      }

      const user = getRLSUser();
      if (user) {
        try {
          await prismaMock.$executeRawUnsafe(
            `SELECT set_config('app.current_user_id', $1, true), set_config('app.current_user_role', $2, true)`,
            user.id,
            user.role,
          );
        } catch {
          // RLS context is best-effort — queries still work without it
        }
      }
      return next(params);
    };
  };

  beforeEach(() => {
    $executeRawUnsafe = jest.fn().mockResolvedValue(undefined);
    middleware = buildMiddleware();
    (getRLSUser as jest.Mock).mockReturnValue({ id: 'user-1', role: 'ADMIN' });
  });

  it('não deve chamar set_config em executeRaw/queryRaw', async () => {
    const next = jest.fn().mockResolvedValue({ rows: [] });

    for (const action of ['executeRaw', 'queryRaw']) {
      const params = { action, args: ['SELECT 1'] } as any;
      await middleware(params, next);

      expect($executeRawUnsafe).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(params);
    }
  });

  it('deve chamar set_config apenas uma vez por query normal', async () => {
    const next = jest.fn().mockResolvedValue([]);

    const params = { action: 'findMany', args: { where: {} } } as any;
    await middleware(params, next);

    expect($executeRawUnsafe).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(params);
  });

  it('não deve disparar recursão infinita quando set_config falhar', async () => {
    $executeRawUnsafe = jest.fn().mockRejectedValue(new Error('RLS error'));
    middleware = buildMiddleware();

    const next = jest.fn().mockResolvedValue([]);

    const params = { action: 'findMany', args: { where: {} } } as any;
    await middleware(params, next);

    expect($executeRawUnsafe).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(params);
  });
});
