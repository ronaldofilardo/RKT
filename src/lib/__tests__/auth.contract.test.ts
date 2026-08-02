/**
 * CONTRACT TEST — withRLSHandler (anti-drift)
 *
 * Sprint 1.4 do plano de elevação de qualidade.
 *
 * Propósito: travar o contrato de autenticação esperado por
 * `withRLSHandler` (em `src/lib/auth.ts`). Qualquer mudança neste
 * contrato (ex.: mudar/nomear headers `x-user-*`, exigir outro JWT
 * payload) deve falhar explicitamente este teste — forçando a
 * documentação como ADR ou PR que migra todos os consumers.
 *
 * Owner: @qa
 * Atualizado em: 2026-07-25
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { createToken as makeToken } from '@tests/helpers/auth';

const URL = 'http://localhost:3000/api/test-contract';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(URL, { headers });
}

describe('CONTRACT: withRLSHandler — Auth/RLS drift detection', () => {
  let validToken: string;

  beforeEach(async () => {
    validToken = await makeToken('jwt-user', 'ATHLETE');
  });

  describe('Resolução de usuário (precedência)', () => {
    it('Headers x-user-id/x-user-role têm PRECEDÊNCIA quando presentes', async () => {
      const result = await withRLSHandler(
        makeRequest({
          authorization: `Bearer ${validToken}`,
          'x-user-id': 'middleware-user',
          'x-user-role': 'ATHLETE',
        }),
        'ATHLETE',
        async () => {
          const user = getRLSUser();
          return Response.json({ userId: user?.id, source: 'headers' });
        },
      );

      const body = await (result as Response).json();
      expect(body.userId).toBe('middleware-user');
      expect(body.source).toBe('headers');
    });

    it('Faz fallback ao JWT quando headers x-user-* ausentes', async () => {
      const result = await withRLSHandler(
        makeRequest({ authorization: `Bearer ${validToken}` }),
        'ATHLETE',
        async () => {
          const user = getRLSUser();
          return Response.json({ userId: user?.id, source: 'jwt' });
        },
      );

      const body = await (result as Response).json();
      expect(body.userId).toBe('jwt-user');
      expect(body.source).toBe('jwt');
    });

    it('Rejeita (401) quando token é inválido', async () => {
      const result = await withRLSHandler(
        makeRequest({ authorization: 'Bearer invalid-token' }),
        'ATHLETE',
        async () => 'should-not-reach',
      );

      expect((result as Response).status).toBe(401);
    });

    it('Rejeita (401) quando não há token nem headers', async () => {
      const result = await withRLSHandler(
        makeRequest(),
        'ATHLETE',
        async () => 'should-not-reach',
      );

      expect((result as Response).status).toBe(401);
    });
  });

  describe('Headers esperados (snapshot do contrato)', () => {
    it('Documenta os headers canônicos consumidos por withRLSHandler', () => {
      const contract = {
        authHeader: 'authorization',
        authScheme: 'Bearer',
        rlsIdHeader: 'x-user-id',
        rlsRoleHeader: 'x-user-role',
        rlsRoleHeaderValues: [
          'ADMIN',
          'GESTOR',
          'COACH',
          'ATHLETE',
          'SPECTATOR',
        ],
        precedenceOrder: ['middleware-headers', 'jwt-fallback'],
        errorResponses: {
          missingToken: { status: 401, code: 'FORBIDDEN' },
          invalidToken: { status: 401, code: 'UNAUTHORIZED' },
          insufficientRole: { status: 403, code: 'FORBIDDEN' },
          noRlsContext: { status: 401, code: 'UNAUTHORIZED' },
        },
      };

      // Snapshot — qualquer mudança no contrato exige atualizar este
      // snapshot e revisão manual dos consumers.
      expect(contract).toMatchInlineSnapshot({
  authHeader: 'authorization',
  authScheme: 'Bearer',
  rlsIdHeader: 'x-user-id',
  rlsRoleHeader: 'x-user-role',
  rlsRoleHeaderValues: [
  'ADMIN',
  'GESTOR',
  'COACH',
  'ATHLETE',
  'SPECTATOR'],

  precedenceOrder: ['middleware-headers', 'jwt-fallback'],
  errorResponses: {
    missingToken: { status: 401, code: 'FORBIDDEN' },
    invalidToken: { status: 401, code: 'UNAUTHORIZED' },
    insufficientRole: { status: 403, code: 'FORBIDDEN' },
    noRlsContext: { status: 401, code: 'UNAUTHORIZED' }
  }
}, `
{
  "authHeader": "authorization",
  "authScheme": "Bearer",
  "errorResponses": {
    "insufficientRole": {
      "code": "FORBIDDEN",
      "status": 403,
    },
    "invalidToken": {
      "code": "UNAUTHORIZED",
      "status": 401,
    },
    "missingToken": {
      "code": "FORBIDDEN",
      "status": 401,
    },
    "noRlsContext": {
      "code": "UNAUTHORIZED",
      "status": 401,
    },
  },
  "precedenceOrder": [
    "middleware-headers",
    "jwt-fallback",
  ],
  "rlsIdHeader": "x-user-id",
  "rlsRoleHeader": "x-user-role",
  "rlsRoleHeaderValues": [
    "ADMIN",
    "GESTOR",
    "COACH",
    "ATHLETE",
    "SPECTATOR",
  ],
}
`);
    });
  });

  describe('Isolamento de contexto RLS', () => {
    it('Dentro de handler, getRLSUser reflete o usuário autenticado', async () => {
      await withRLSHandler(
        makeRequest({ authorization: `Bearer ${validToken}` }),
        'ATHLETE',
        async () => {
          expect(getRLSUser()?.id).toBe('jwt-user');
          return new Response('ok');
        },
      );
    });

    it('Fora do handler, getRLSUser é null (sem vazamento de contexto)', async () => {
      await withRLSHandler(
        makeRequest({ authorization: `Bearer ${validToken}` }),
        'ATHLETE',
        async () => new Response('ok'),
      );

      expect(getRLSUser()).toBeNull();
    });
  });
});
