/**
 * Baseline de Caracterização — Fronteiras de RBAC e Hierarquia de Roles
 * 
 * Este arquivo congela o comportamento ATUAL observado da camada de autenticação
 * e verificação de roles (src/lib/auth.ts: requireRole e withRLSHandler).
 * 
 * Níveis Canônicos:
 * 5: ADMIN
 * 4: GESTOR
 * 3: COACH
 * 2: ATHLETE
 * 1: SPECTATOR
 */

import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import { requireRole, withRLSHandler, getRLSUser } from '@/lib/auth';
import type { Role } from '@/schemas/contracts';

const BASE_URL = 'http://localhost:3000/api/test-rbac';

function createMockRequest(user?: { id: string; role: string }): NextRequest {
  const headers: Record<string, string> = {};
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
  }
  return new NextRequest(BASE_URL, { headers });
}

describe('RBAC Boundaries Baseline (Characterization)', () => {
  describe('requireRole - Verificação Hierárquica', () => {
    it('deve retornar 401 se nenhum usuário estiver autenticado', async () => {
      const req = createMockRequest();
      const res = await requireRole(req, 'ATHLETE');
      expect(res).not.toBeNull();
      expect(res?.status).toBe(401);
      const data = await res?.json();
      expect(data.error).toBe('FORBIDDEN');
    });

    it('deve retornar 403 se a role for inferior à role requerida', async () => {
      const athleteReq = createMockRequest({ id: 'user-1', role: 'ATHLETE' });
      // ATHLETE (nível 2) tentando acessar recurso de COACH (nível 3)
      const res = await requireRole(athleteReq, 'COACH');
      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      const data = await res?.json();
      expect(data.message).toContain('Requer role COACH ou superior');
    });

    it('deve permitir acesso quando a role for idêntica à requerida', async () => {
      const coachReq = createMockRequest({ id: 'user-2', role: 'COACH' });
      const res = await requireRole(coachReq, 'COACH');
      expect(res).toBeNull(); // null indica autorização concedida
    });

    it('deve permitir acesso quando a role for superior à requerida (herança linear)', async () => {
      const adminReq = createMockRequest({ id: 'admin-1', role: 'ADMIN' });
      // ADMIN (nível 5) acessando recurso de SPECTATOR (nível 1)
      const res = await requireRole(adminReq, 'SPECTATOR');
      expect(res).toBeNull();
    });

    it('SUSPECT: TD-051 — Na hierarquia linear atual, COACH (3) herda permissões de ATHLETE (2)', async () => {
      // COMPORTAMENTO OBSERVADO:
      // O teste E2E (05-role-boundaries.spec.ts) assume que COACH não pode chamar POST /api/matches (que pede ATHLETE).
      // Mas a função canônica requireRole permite COACH em ATHLETE porque 3 >= 2.
      const coachReq = createMockRequest({ id: 'coach-1', role: 'COACH' });
      const res = await requireRole(coachReq, 'ATHLETE');
      // Documentamos o comportamento real da função:
      expect(res).toBeNull(); // Autoriza!
    });
  });

  describe('withRLSHandler - Injeção e Isolamento de Contexto', () => {
    it('deve executar o handler com contexto RLS ativo e limpar após execução', async () => {
      const req = createMockRequest({ id: 'atleta-123', role: 'ATHLETE' });

      let capturedUser: ReturnType<typeof getRLSUser> = null;

      const response = await withRLSHandler(req, 'ATHLETE', async () => {
        capturedUser = getRLSUser();
        return Response.json({ success: true });
      });

      expect((response as Response).status).toBe(200);
      expect(capturedUser).toEqual({ id: 'atleta-123', role: 'ATHLETE' });

      // Após o término de withRLSHandler, o contexto do AsyncLocalStorage deve ser nulo
      expect(getRLSUser()).toBeNull();
    });

    it('deve barrar a execução do handler se a role for insuficiente', async () => {
      const spectatorReq = createMockRequest({ id: 'spec-1', role: 'SPECTATOR' });

      let handlerExecuted = false;

      const response = await withRLSHandler(spectatorReq, 'COACH', async () => {
        handlerExecuted = true;
        return Response.json({ success: true });
      });

      expect(handlerExecuted).toBe(false);
      expect((response as Response).status).toBe(403);
    });
  });

  describe('Permissões Granulares por Recursos (hasPermission & requirePermission)', () => {
    it('deve validar permissões específicas por papel sem herança cega', () => {
      const { hasPermission } = require('@/lib/auth');

      // ATHLETE pode jogar, COACH não é jogador por padrão
      expect(hasPermission('ATHLETE', 'play:match')).toBe(true);
      expect(hasPermission('COACH', 'play:match')).toBe(false);

      // COACH pode ver estatísticas táticas, ATHLETE comum não
      expect(hasPermission('COACH', 'view:tactical_stats')).toBe(true);
      expect(hasPermission('ATHLETE', 'view:tactical_stats')).toBe(false);

      // ADMIN e GESTOR têm privilégios administrativos
      expect(hasPermission('ADMIN', 'manage:users')).toBe(true);
      expect(hasPermission('COACH', 'manage:users')).toBe(false);
    });

    it('requirePermission deve bloquear ação não permitida com 403', async () => {
      const { requirePermission } = require('@/lib/auth');
      const coachReq = createMockRequest({ id: 'coach-1', role: 'COACH' });

      const res = await requirePermission(coachReq, 'play:match');
      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      const data = await res?.json();
      expect(data.message).toContain('Ação não permitida para a role COACH');
    });

    it('requirePermission deve autorizar ação permitida retornando null', async () => {
      const { requirePermission } = require('@/lib/auth');
      const athleteReq = createMockRequest({ id: 'ath-1', role: 'ATHLETE' });

      const res = await requirePermission(athleteReq, 'play:match');
      expect(res).toBeNull();
    });

    it('withPermissionHandler deve executar com RLS quando autorizado', async () => {
      const { withPermissionHandler } = require('@/lib/auth');
      const coachReq = createMockRequest({ id: 'coach-1', role: 'COACH' });

      let executed = false;
      const res = await withPermissionHandler(coachReq, 'view:tactical_stats', async () => {
        executed = true;
        return Response.json({ ok: true });
      });

      expect(executed).toBe(true);
      expect((res as Response).status).toBe(200);
    });
  });
});

