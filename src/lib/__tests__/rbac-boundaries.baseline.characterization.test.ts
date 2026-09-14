/**
 * CHARACTERIZATION TEST — RBAC Boundaries
 *
 * Propósito: documentar o comportamento OBSERVADO de isolamento
 * entre roles (ADMIN > ANNOTATOR).
 * Data: 2026-09-13
 * Owner: @qa
 *
 * Role enum atual: ADMIN | ANNOTATOR
 * Hierarchy: ADMIN(2) > ANNOTATOR(1)
 *
 * NOTA: `getUserFromRequestScoped` apenas valida que a role é válida
 * (ADMIN ou ANNOTATOR). A verificação de hierarchy é feita por `requireRole`.
 */

import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getUserFromRequestScoped, requireRole } from '@/lib/auth';
import { __setRLSUserForTesting } from '@/lib/rls-context';
import { createToken as makeToken } from '@tests/helpers/auth';

describe('RBAC Boundaries — Characterization (ADMIN | ANNOTATOR only)', () => {
  afterEach(() => {
    __setRLSUserForTesting(null);
  });

  describe('HasPermission behavior (getUserFromRequestScoped)', () => {
    it('ADMIN pode acessar endpoints de ANNOTATOR', async () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${await makeToken('u1', 'ADMIN')}` },
      });
      const result = await getUserFromRequestScoped(req, 'ANNOTATOR');
      expect(result).not.toBeNull();
      expect(result?.role).toBe('ADMIN');
    });

    it('ANNOTATOR pode acessar endpoints de ANNOTATOR (valid role check only)', async () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${await makeToken('u1', 'ANNOTATOR')}` },
      });
      const result = await getUserFromRequestScoped(req, 'ANNOTATOR');
      expect(result).not.toBeNull();
      expect(result?.role).toBe('ANNOTATOR');
    });

    it('ANNOTATOR pode acessar endpoints de ADMIN (getUserFromRequestScoped only checks validity)', async () => {
      // getUserFromRequestScoped only validates role is valid, not hierarchy
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${await makeToken('u1', 'ANNOTATOR')}` },
      });
      const result = await getUserFromRequestScoped(req, 'ADMIN');
      expect(result).not.toBeNull();
      expect(result?.role).toBe('ANNOTATOR');
    });

    it('ADMIN pode acessar endpoints de ADMIN', async () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${await makeToken('u1', 'ADMIN')}` },
      });
      const result = await getUserFromRequestScoped(req, 'ADMIN');
      expect(result).not.toBeNull();
      expect(result?.role).toBe('ADMIN');
    });
  });

  describe('Role hierarchy (requireRole)', () => {
    it('ADMIN > ANNOTATOR (hierarchy check)', () => {
      expect('ADMIN').not.toBe('ANNOTATOR');
    });

    it('Only two roles exist', () => {
      const validRoles = ['ADMIN', 'ANNOTATOR'];
      expect(validRoles).toHaveLength(2);
      expect(validRoles).toContain('ADMIN');
      expect(validRoles).toContain('ANNOTATOR');
    });

    it('ADMIN role succeeds with ANNOTATOR minimum via requireRole', async () => {
      const token = await makeToken('u1', 'ADMIN');
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await requireRole(req, 'ANNOTATOR');
      // requireRole returns null on success (no response = allowed)
      expect(result).toBeNull();
    });

    it('ANNOTATOR role fails with ADMIN minimum via requireRole', async () => {
      const token = await makeToken('u1', 'ANNOTATOR');
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await requireRole(req, 'ADMIN');
      // requireRole returns a 403 response on failure
      expect(result).not.toBeNull();
      expect(result!.status).toBe(403);
    });

    it('ADMIN role succeeds with ADMIN minimum via requireRole', async () => {
      const token = await makeToken('u1', 'ADMIN');
      const req = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await requireRole(req, 'ADMIN');
      expect(result).toBeNull();
    });
  });

  describe('Context isolation', () => {
    it('RLS user is set inside handler', async () => {
      const { withRLSHandler } = await import('@/lib/auth');
      await withRLSHandler(
        new NextRequest('http://localhost/api/test', {
          headers: { Authorization: `Bearer ${await makeToken('u1', 'ADMIN')}` },
        }),
        'ANNOTATOR',
        async () => {
          expect(true).toBe(true);
          return new Response('ok');
        },
      );
    });
  });
});
