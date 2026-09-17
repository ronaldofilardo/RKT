import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  hasPermission,
  requirePermission,
  withPermissionHandler,
  ROLE_PERMISSIONS,
  type AppAction,
} from '@/lib/auth';
import { createToken as makeToken } from '@tests/helpers/auth';

describe('hasPermission', () => {
  it('ADMIN has manage:users', () => {
    expect(hasPermission('ADMIN', 'manage:users')).toBe(true);
  });

  it('ADMIN has manage:clubs', () => {
    expect(hasPermission('ADMIN', 'manage:clubs')).toBe(true);
  });

  it('ADMIN does NOT have score:match', () => {
    expect(hasPermission('ADMIN', 'score:match')).toBe(false);
  });

  it('ANNOTATOR has score:match', () => {
    expect(hasPermission('ANNOTATOR', 'score:match')).toBe(true);
  });

  it('ANNOTATOR does NOT have manage:users', () => {
    expect(hasPermission('ANNOTATOR', 'manage:users')).toBe(false);
  });

  it('returns false for unknown action', () => {
    expect(hasPermission('ADMIN', 'nonexistent:action' as AppAction)).toBe(false);
  });
});

describe('requirePermission', () => {
  it('401 when no token', async () => {
    const req = new NextRequest('http://localhost/api/test');
    const result = await requirePermission(req, 'manage:users');
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('403 when role lacks permission', async () => {
    const token = await makeToken('user-1', 'ANNOTATOR');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await requirePermission(req, 'manage:users');
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('null when role has permission (success)', async () => {
    const token = await makeToken('user-1', 'ADMIN');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await requirePermission(req, 'manage:users');
    expect(result).toBeNull();
  });
});

describe('withPermissionHandler', () => {
  it('401 when no auth', async () => {
    const req = new NextRequest('http://localhost/api/test');
    const result = await withPermissionHandler(req, 'manage:users', async () => {
      return new Response('ok');
    });
    expect((result as Response).status).toBe(401);
  });

  it('403 when role lacks permission', async () => {
    const token = await makeToken('user-1', 'ANNOTATOR');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await withPermissionHandler(req, 'manage:users', async () => {
      return new Response('ok');
    });
    expect((result as Response).status).toBe(403);
  });

  it('calls handler when permission OK', async () => {
    const token = await makeToken('user-1', 'ADMIN');
    const req = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await withPermissionHandler(req, 'manage:users', async () => {
      return new Response('allowed');
    });
    const body = await (result as Response).text();
    expect(body).toBe('allowed');
  });
});

describe('ROLE_PERMISSIONS completeness', () => {
  it('all roles have permission arrays', () => {
    expect(ROLE_PERMISSIONS.ADMIN).toBeDefined();
    expect(ROLE_PERMISSIONS.ANNOTATOR).toBeDefined();
    expect(Array.isArray(ROLE_PERMISSIONS.ADMIN)).toBe(true);
    expect(Array.isArray(ROLE_PERMISSIONS.ANNOTATOR)).toBe(true);
  });
});
