/**
 * UNIT TEST — getUserFromRequestScoped (anti-regex-drift)
 *
 * Sprint 1.4 do plano de elevação de qualidade.
 *
 * Propósito: validar o comportamento explícito de
 * `getUserFromRequestScoped` para cenários que, se rompidos,
 * causam 401/403 silenciosos em produção.
 *
 * Owner: @qa
 * Atualizado em: 2026-09-13 — Role enum: ADMIN | ANNOTATOR
 */

import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getUserFromRequestScoped, requireRole } from '@/lib/auth';
import { createToken as makeToken } from '@tests/helpers/auth';

describe('getUserFromRequestScoped — Auth drift detection', () => {
  it('401 quando Authorization é um Bearer com token inválido', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Bearer INVALID_TOKEN_VALUE' },
    });

    const result = await getUserFromRequestScoped(req);
    expect(result).toBeNull();
  });

  it('401 quando Authorization não existe', async () => {
    const req = new NextRequest('http://localhost/api/test');

    const result = await getUserFromRequestScoped(req);
    expect(result).toBeNull();
  });

  it('Retorna null quando Authorization existe, mas não é Bearer', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Basic abc123' },
    });

    const result = await getUserFromRequestScoped(req);
    expect(result).toBeNull();
  });

  it('Extrai user do JWT com role válida', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${await makeToken('jwt-user', 'ANNOTATOR')}` },
    });

    const result = await getUserFromRequestScoped(req);

    expect(result).not.toBeNull();
    expect(result?.role).toBe('ANNOTATOR');
  });

  it('Extrai user do JWT com role ADMIN', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${await makeToken('jwt-user', 'ADMIN')}` },
    });

    const result = await getUserFromRequestScoped(req);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('jwt-user');
  });
});

describe('requireRole — Role guard drift detection', () => {
  it('401 quando não há token (sem contexto de auth)', async () => {
    const req = new NextRequest('http://localhost/api/test');
    const result = await requireRole(req, 'ANNOTATOR');

    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('403 quando role é insuficiente', async () => {
    const token = await makeToken('user-1', 'ANNOTATOR');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await requireRole(req, 'ADMIN');

    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('null quando role é exatamente a mínima exigida (success)', async () => {
    const token = await makeToken('user-1', 'ADMIN');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await requireRole(req, 'ADMIN');

    // requireRole returns null on success (no response needed)
    expect(result).toBeNull();
  });

  it('null quando role é superior à mínima exigida (success)', async () => {
    const token = await makeToken('user-1', 'ADMIN');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await requireRole(req, 'ANNOTATOR');

    expect(result).toBeNull();
  });

  it('null quando ANNOTATOR cumpre mínimo ANNOTATOR', async () => {
    const token = await makeToken('user-1', 'ANNOTATOR');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await requireRole(req, 'ANNOTATOR');

    // ANNOTATOR >= ANNOTATOR, so this should succeed
    expect(result).toBeNull();
  });
});
