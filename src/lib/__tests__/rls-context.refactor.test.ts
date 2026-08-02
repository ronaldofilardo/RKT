/**
 * TESTES DE REFACTOR — rls-context.ts
 * 
 * Testes para as novas funcionalidades de RLS:
 * - Validação de usuário
 * - runWithRLS (cleanup automático)
 * - runWithRLSSync
 * - withRLSMiddleware
 * - withRLSFilter
 * 
 * Owner: @qa
 * Data: 2026-07-20
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  getRLSUser,
  __setRLSUserForTesting,
  __clearRLSUserForTesting,
  runWithRLS,
  runWithRLSSync,
  withRLSMiddleware,
  withRLSFilter,
  type RLSUser,
} from '../rls-context';

describe('rls-context (refactor tests)', () => {
  beforeEach(() => {
    __setRLSUserForTesting(null);
  });

  afterEach(() => {
    __clearRLSUserForTesting();
  });

  describe('Validação de RLSUser', () => {
    it('deve aceitar usuário válido com role ADMIN', () => {
      const user: RLSUser = { id: 'user-123', role: 'ADMIN' };
      expect(() => __setRLSUserForTesting(user)).not.toThrow();
      expect(getRLSUser()).toEqual(user);
    });

    it('deve aceitar usuário válido com role GESTOR', () => {
      const user: RLSUser = { id: 'user-123', role: 'GESTOR' };
      expect(() => __setRLSUserForTesting(user)).not.toThrow();
    });

    it('deve aceitar usuário válido com role COACH', () => {
      const user: RLSUser = { id: 'user-123', role: 'COACH' };
      expect(() => __setRLSUserForTesting(user)).not.toThrow();
    });

    it('deve aceitar usuário válido com role ATHLETE', () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      expect(() => __setRLSUserForTesting(user)).not.toThrow();
    });

    it('deve aceitar usuário válido com role SPECTATOR', () => {
      const user: RLSUser = { id: 'user-123', role: 'SPECTATOR' };
      expect(() => __setRLSUserForTesting(user)).not.toThrow();
    });

    it('deve lançar erro para id vazio', () => {
      const user: RLSUser = { id: '', role: 'ATHLETE' };
      expect(() => __setRLSUserForTesting(user)).toThrow('Invalid RLS user');
    });

    it('deve lançar erro para id com apenas espaços', () => {
      const user: RLSUser = { id: '   ', role: 'ATHLETE' };
      expect(() => __setRLSUserForTesting(user)).toThrow('Invalid RLS user');
    });

    it('deve lançar erro para role inválido', () => {
      const user: RLSUser = { id: 'user-123', role: 'INVALID_ROLE' };
      expect(() => __setRLSUserForTesting(user)).toThrow('Invalid RLS user');
    });

    it('deve lançar erro para role em lowercase', () => {
      const user: RLSUser = { id: 'user-123', role: 'admin' };
      expect(() => __setRLSUserForTesting(user)).toThrow('Invalid RLS user');
    });
  });

  describe('runWithRLS', () => {
    it('deve executar função com contexto RLS ativo', async () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      
      const result = await runWithRLS(user, async () => {
        return getRLSUser();
      });

      expect(result).toEqual(user);
    });

    it('deve fazer cleanup após execução', async () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      
      await runWithRLS(user, async () => {
        // Dentro do contexto
        expect(getRLSUser()).toEqual(user);
      });

      // Fora do contexto — cleanup feito
      expect(getRLSUser()).toBeNull();
    });

    it('deve fazer cleanup mesmo em caso de erro', async () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      
      await expect(
        runWithRLS(user, async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      // Cleanup deve ter ocorrido mesmo com erro
      expect(getRLSUser()).toBeNull();
    });

    it('deve executar função sem contexto quando user for null', async () => {
      const result = await runWithRLS(null, async () => {
        return getRLSUser();
      });

      expect(result).toBeNull();
    });

    it('deve lançar erro para usuário inválido', async () => {
      const invalidUser: RLSUser = { id: '', role: 'ATHLETE' };
      
      await expect(
        runWithRLS(invalidUser, async () => 'test')
      ).rejects.toThrow('Invalid RLS user in runWithRLS');
    });

    it('deve permitir execução em cascata (nested runWithRLS)', async () => {
      const user1: RLSUser = { id: 'user-1', role: 'ATHLETE' };
      const user2: RLSUser = { id: 'user-2', role: 'COACH' };
      
      const result = await runWithRLS(user1, async () => {
        expect(getRLSUser()).toEqual(user1);
        
        const innerResult = await runWithRLS(user2, async () => {
          return getRLSUser();
        });
        
        expect(getRLSUser()).toEqual(user1); // Volta ao contexto externo
        return innerResult;
      });

      expect(result).toEqual(user2);
    });
  });

  describe('runWithRLSSync', () => {
    it('deve executar função síncrona com contexto RLS', () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      
      const result = runWithRLSSync(user, () => {
        return getRLSUser();
      });

      expect(result).toEqual(user);
    });

    it('deve fazer cleanup após execução síncrona', () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      
      runWithRLSSync(user, () => {
        expect(getRLSUser()).toEqual(user);
      });

      expect(getRLSUser()).toBeNull();
    });

    it('deve executar função sem contexto quando user for null', () => {
      const result = runWithRLSSync(null, () => {
        return getRLSUser();
      });

      expect(result).toBeNull();
    });

    it('deve lançar erro para usuário inválido', () => {
      const invalidUser: RLSUser = { id: '', role: 'ATHLETE' };
      
      expect(() =>
        runWithRLSSync(invalidUser, () => 'test')
      ).toThrow('Invalid RLS user in runWithRLSSync');
    });
  });

  describe('withRLSMiddleware', () => {
    it('deve executar handler com contexto RLS ativo', async () => {
      const getUser = jest.fn<(ctx: any) => RLSUser | null>().mockReturnValue({
        id: 'user-123',
        role: 'ATHLETE',
      });

      const handler = jest.fn<any>().mockResolvedValue('success');

      const middleware = withRLSMiddleware(getUser, handler);
      const result = await middleware({ request: 'test' });

      expect(result).toBe('success');
      expect(getUser).toHaveBeenCalledWith({ request: 'test' });
      expect(handler).toHaveBeenCalledWith({ request: 'test' }, expect.objectContaining({
        id: 'user-123',
        role: 'ATHLETE',
      }));
    });

    it('deve fazer cleanup após execução do handler', async () => {
      const getUser = jest.fn<(ctx: any) => RLSUser | null>().mockReturnValue({
        id: 'user-123',
        role: 'ATHLETE',
      });

      const handler = jest.fn<any>().mockImplementation(async (ctx, user) => {
        expect(getRLSUser()).toEqual(user);
        return 'done';
      });

      const middleware = withRLSMiddleware(getUser, handler);
      await middleware({});

      // Cleanup após middleware
      expect(getRLSUser()).toBeNull();
    });

    it('deve executar handler com null quando getUser retornar null', async () => {
      const getUser = jest.fn<(ctx: any) => RLSUser | null>().mockReturnValue(null);
      const handler = jest.fn<any>().mockResolvedValue('success');

      const middleware = withRLSMiddleware(getUser, handler);
      await middleware({});

      expect(handler).toHaveBeenCalledWith({}, null);
    });

    it('deve lançar erro para usuário inválido', async () => {
      const getUser = jest.fn<(ctx: any) => RLSUser | null>().mockReturnValue({
        id: '',
        role: 'INVALID',
      });

      const middleware = withRLSMiddleware(getUser, jest.fn());

      await expect(middleware({})).rejects.toThrow('Invalid RLS user from middleware');
    });
  });

  describe('withRLSFilter', () => {
    it('deve retornar query original para ADMIN', () => {
      __setRLSUserForTesting({ id: 'user-123', role: 'ADMIN' });

      const query = { where: { state: 'IN_PROGRESS' } };
      const result = withRLSFilter(query, (q) => ({
        ...q,
        where: { ...q.where, createdByUserId: getRLSUser()?.id },
      }));

      expect(result).toEqual(query);
      expect(result.where.createdByUserId).toBeUndefined();
    });

    it('deve aplicar filtro para não-ADMIN', () => {
      __setRLSUserForTesting({ id: 'user-123', role: 'ATHLETE' });

      const query = { where: { state: 'IN_PROGRESS' } };
      const result = withRLSFilter(query, (q) => ({
        ...q,
        where: { ...q.where, createdByUserId: getRLSUser()?.id },
      }));

      expect(result.where.createdByUserId).toBe('user-123');
    });

    it('deve retornar query original quando user for null', () => {
      __setRLSUserForTesting(null);

      const query = { where: { state: 'IN_PROGRESS' } };
      const result = withRLSFilter(query, (q) => ({
        ...q,
        where: { ...q.where, createdByUserId: getRLSUser()?.id },
      }));

      expect(result).toEqual(query);
    });
  });
});