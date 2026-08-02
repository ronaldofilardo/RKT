/**
 * TEMPLATE DE TESTE DE API — rkt
 * 
 * Copie este arquivo como base para testes de API routes.
 * 
 * Owner: @qa
 * Status: Template oficial (Onda 1 — Guardrails)
 * 
 * INSTRUÇÕES:
 * 1. Copie para src/app/api/[resource]/__tests__/route.test.ts
 * 2. Substitua [Resource], [resource], [resourceService]
 * 3. Implemente casos de teste (feliz, erros, edge cases)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestPlayer, createAuthHeader, cleanup } from '@/test/helpers';
import { Player } from '@prisma/client';

describe('GET /api/[resource]', () => {
  let testUser: Player;

  beforeEach(async () => {
    testUser = await createTestPlayer({ role: 'ATHLETE' });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('deve retornar 200 com lista de [resource]', async () => {
    const response = await fetch('http://localhost:3000/api/[resource]', {
      headers: createAuthHeader(testUser),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('deve retornar 401 sem autenticação', async () => {
    const response = await fetch('http://localhost:3000/api/[resource]');
    expect(response.status).toBe(401);
  });

  it('deve aplicar paginação com limit=10', async () => {
    // Criar 15 [resource] para teste de paginação
    // ...

    const response = await fetch(
      'http://localhost:3000/api/[resource]?limit=10',
      { headers: createAuthHeader(testUser) }
    );

    const json = await response.json();
    expect(json.data.length).toBeLessThanOrEqual(10);
    expect(json.nextCursor).toBeDefined();
  });
});

describe('POST /api/[resource]', () => {
  let testUser: Player;

  beforeEach(async () => {
    testUser = await createTestPlayer({ role: 'ATHLETE' });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('deve criar [resource] com dados válidos', async () => {
    const body = {
      // Dados válidos aqui
    };

    const response = await fetch('http://localhost:3000/api/[resource]', {
      method: 'POST',
      headers: {
        ...createAuthHeader(testUser),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.data).toBeDefined();
    expect(json.data.id).toBeDefined();
  });

  it('deve retornar 400 com dados inválidos', async () => {
    const body = {
      // Dados inválidos aqui
    };

    const response = await fetch('http://localhost:3000/api/[resource]', {
      method: 'POST',
      headers: {
        ...createAuthHeader(testUser),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 403 com role insuficiente', async () => {
    const spectator = await createTestPlayer({ role: 'SPECTATOR' });
    
    const response = await fetch('http://localhost:3000/api/[resource]', {
      method: 'POST',
      headers: {
        ...createAuthHeader(spectator),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(403);
  });
});

describe('PUT /api/[resource]/:id', () => {
  let testUser: Player;
  let [resource]Id: string;

  beforeEach(async () => {
    testUser = await createTestPlayer({ role: 'ATHLETE' });
    // Criar [resource] para teste
    // [resource]Id = ...
  });

  afterEach(async () => {
    await cleanup();
  });

  it('deve atualizar [resource] existente', async () => {
    const body = {
      // Campos para atualizar
    };

    const response = await fetch(`http://localhost:3000/api/[resource]/${[resource]Id}`, {
      method: 'PUT',
      headers: {
        ...createAuthHeader(testUser),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(200);
  });

  it('deve retornar 404 se [resource] não existir', async () => {
    const body = {};

    const response = await fetch('http://localhost:3000/api/[resource]/non-existent-id', {
      method: 'PUT',
      headers: {
        ...createAuthHeader(testUser),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/[resource]/:id', () => {
  let testUser: Player;
  let [resource]Id: string;

  beforeEach(async () => {
    testUser = await createTestPlayer({ role: 'ATHLETE' });
    // Criar [resource] para teste
    // [resource]Id = ...
  });

  afterEach(async () => {
    await cleanup();
  });

  it('deve deletar [resource] existente', async () => {
    const response = await fetch(`http://localhost:3000/api/[resource]/${[resource]Id}`, {
      method: 'DELETE',
      headers: createAuthHeader(testUser),
    });

    expect(response.status).toBe(204);
  });

  it('deve retornar 404 se [resource] não existir', async () => {
    const response = await fetch('http://localhost:3000/api/[resource]/non-existent-id', {
      method: 'DELETE',
      headers: createAuthHeader(testUser),
    });

    expect(response.status).toBe(404);
  });
});