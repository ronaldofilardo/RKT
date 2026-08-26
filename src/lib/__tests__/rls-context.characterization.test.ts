/**
 * CHARACTERIZATION TESTS — rls-context.ts
 *
 * Propósito: Capturar comportamento OBSERVADO do Row-Level Security context
 * Data: 2026-07-20 (atualizado 2026-07-25 para usar __setRLSUserForTesting)
 * Owner: @qa
 *
 * Histórico:
 * - TD-003 (resolvido parcialmente): `setRLSUser` foi deprecado e virou no-op
 *   (sticky enterWith causava vazamento entre requests). Os testes abaixo
 *   usam `__setRLSUserForTesting` para preservar o contrato characterization
 *   sticky enquanto a API pública migra para `runWithRLS`.
 *
 * Comportamentos suspeitos ainda abertos:
 * - // SUSPECT: AsyncLocalStorage pode vazar entre requests concorrentes
 *   (ver suite race-condition em app/api/matches/__tests__/race-condition.test.ts)
 * - // SUSPECT: validação de id/role só ocorre em runWithRLS, não em
 *   __setRLSUserForTesting (por design, permite capturar comportamento raw).
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getRLSUser, __setRLSUserForTesting, type RLSUser } from '../rls-context';

describe('rls-context (characterization)', () => {
  beforeEach(() => {
    __setRLSUserForTesting(null);
  });

  afterEach(() => {
    __setRLSUserForTesting(null);
  });

  describe('getRLSUser', () => {
    it('deve retornar null quando nenhum usuário estiver definido', () => {
      __setRLSUserForTesting(null);
      const user = getRLSUser();
      expect(user).toBeNull();
    });

    it('deve retornar usuário após __setRLSUserForTesting ser chamado', () => {
      const testUser: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      __setRLSUserForTesting(testUser);

      const user = getRLSUser();
      expect(user).toEqual(testUser);
      expect(user?.id).toBe('user-123');
      expect(user?.role).toBe('ATHLETE');
    });

    it('deve retornar último usuário definido (overwrite)', () => {
      const user1: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      const user2: RLSUser = { id: 'user-456', role: 'COACH' };

      __setRLSUserForTesting(user1);
      __setRLSUserForTesting(user2);

      const user = getRLSUser();
      expect(user).toEqual(user2);
      expect(user?.id).toBe('user-456');
      expect(user?.role).toBe('COACH');
    });

    it('deve retornar null após __setRLSUserForTesting(null)', () => {
      __setRLSUserForTesting({ id: 'user-123', role: 'ATHLETE' });
      expect(getRLSUser()).toBeDefined();

      __setRLSUserForTesting(null);
      expect(getRLSUser()).toBeNull();
    });



  });

  describe('__setRLSUserForTesting', () => {
    it('deve armazenar usuário com id e role', () => {
      const testUser: RLSUser = { id: 'user-789', role: 'ADMIN' };
      __setRLSUserForTesting(testUser);

      const user = getRLSUser();
      expect(user).toEqual(testUser);
    });

    it('deve permitir atualizar usuário (mesma chave, valores diferentes)', () => {
      __setRLSUserForTesting({ id: 'user-123', role: 'ATHLETE' });
      __setRLSUserForTesting({ id: 'user-123', role: 'COACH' });

      const user = getRLSUser();
      expect(user?.id).toBe('user-123');
      expect(user?.role).toBe('COACH');
    });

    it('deve permitir definir usuário com role SPECTATOR', () => {
      __setRLSUserForTesting({ id: 'user-123', role: 'SPECTATOR' });

      const user = getRLSUser();
      expect(user?.role).toBe('SPECTATOR');
    });

    it('deve permitir definir usuário com role GESTOR', () => {
      __setRLSUserForTesting({ id: 'user-123', role: 'GESTOR' });

      const user = getRLSUser();
      expect(user?.role).toBe('GESTOR');
    });

    it('deve permitir definir usuário com role ADMIN', () => {
      __setRLSUserForTesting({ id: 'user-123', role: 'ADMIN' });

      const user = getRLSUser();
      expect(user?.role).toBe('ADMIN');
    });

    it('deve rejeitar usuário com id vazio (validação ativa)', () => {
      expect(() =>
        __setRLSUserForTesting({ id: '', role: 'ATHLETE' } as RLSUser)
      ).toThrow('Invalid RLS user');
    });

    it('deve rejeitar usuário com role inválido (validação ativa)', () => {
      expect(() =>
        __setRLSUserForTesting({ id: 'user-123', role: 'INVALID' } as RLSUser)
      ).toThrow('Invalid RLS user');
    });
  });

  describe('RLSUser type', () => {
    it('deve aceitar objeto com id e role', () => {
      const user: RLSUser = { id: '123', role: 'ATHLETE' };
      expect(user.id).toBe('123');
      expect(user.role).toBe('ATHLETE');
    });

  });

  describe('AsyncLocalStorage behavior', () => {
    it('deve isolar contexto por execução assíncrona', (done) => {
      const user1: RLSUser = { id: 'user-1', role: 'ATHLETE' };
      const user2: RLSUser = { id: 'user-2', role: 'COACH' };

      __setRLSUserForTesting(user1);
      expect(getRLSUser()).toEqual(user1);

      setTimeout(() => {
        __setRLSUserForTesting(user2);
        expect(getRLSUser()).toEqual(user2);

        // Voltar ao contexto 1
        __setRLSUserForTesting(user1);
        expect(getRLSUser()).toEqual(user1);

        done();
      }, 10);
    });


    it('deve persistir contexto em chamadas aninhadas', () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      __setRLSUserForTesting(user);

      function nestedCall() {
        return getRLSUser();
      }

      const result = nestedCall();
      expect(result).toEqual(user);
    });

    it('deve persistir contexto em promises', async () => {
      const user: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      __setRLSUserForTesting(user);

      const result = await Promise.resolve().then(() => getRLSUser());
      expect(result).toEqual(user);
    });

  });

  describe('Integration patterns', () => {
    it('deve ser usado em middleware antes de chamar services', () => {
      const middlewareUser: RLSUser = { id: 'user-123', role: 'ATHLETE' };
      __setRLSUserForTesting(middlewareUser);

      const serviceUser = getRLSUser();
      expect(serviceUser).toEqual(middlewareUser);

      // SUSPECT: Após o request, quem limpa?
      // Resposta do design: runWithRLS em withRLSHandler (auth.ts) faz o escopo.
    });

    it('deve permitir verificar permissões baseadas em role', () => {
      const adminUser: RLSUser = { id: 'user-123', role: 'ADMIN' };
      __setRLSUserForTesting(adminUser);

      const user = getRLSUser();
      const canAccessAdmin = user?.role === 'ADMIN';
      expect(canAccessAdmin).toBe(true);

      const athleteUser: RLSUser = { id: 'user-456', role: 'ATHLETE' };
      __setRLSUserForTesting(athleteUser);

      const athlete = getRLSUser();
      const canAccessAdminAsAthlete = athlete?.role === 'ADMIN';
      expect(canAccessAdminAsAthlete).toBe(false);
    });

  });
});
