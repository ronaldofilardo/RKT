/**
 * E2E TEST CONTEXT — rkt
 * 
 * Helpers para criar e limpar dados de teste.
 * 
 * Owner: @qa
 * Status: Oficial (Onda 1 — Guardrails)
 */

import { APIRequestContext } from '@playwright/test';
import { loginAs, type UserRole } from './auth';

/**
 * Factory: Criar Player via API
 */
export async function createTestPlayer(
  api: APIRequestContext,
  overrides?: {
    name?: string;
    email?: string;
    role?: UserRole;
    club?: string;
  }
) {
  const timestamp = Date.now();
  const email = overrides?.email || `test-player-${timestamp}@example.com`;
  
  // Primeiro faz login como admin para criar usuário
  const { api: adminApi } = await loginAs('admin');
  
  const response = await adminApi.post('/api/admin/users', {
    data: {
      name: overrides?.name || `Test Player ${timestamp}`,
      email,
      role: overrides?.role || 'ATHLETE',
      password: '12345678',
      club: overrides?.club,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create test player: ${response.status()} ${body}`);
  }

  const user = await response.json();
  return user.data;
}

/**
 * Factory: Criar Match via API
 */
export async function createTestMatch(
  api: APIRequestContext,
  player1Id: string,
  player2Id: string,
  overrides?: {
    format?: string;
    sportType?: string;
    scheduledAt?: string;
  }
) {
  const response = await api.post('/api/matches', {
    data: {
      player1Id,
      player2Id,
      format: overrides?.format || 'BEST_OF_3',
      sportType: overrides?.sportType || 'TENNIS',
      scheduledAt: overrides?.scheduledAt ? new Date(overrides.scheduledAt).toISOString() : null,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create test match: ${response.status()} ${body}`);
  }

  const match = await response.json();
  return match.data;
}

/**
 * Factory: Criar Annotation Session via API
 */
export async function createTestSession(
  api: APIRequestContext,
  matchId: string,
  annotatorId: string
) {
  const response = await api.post(`/api/matches/${matchId}/sessions`, {
    data: {
      annotatorUserId: annotatorId,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to create test session: ${response.status()} ${body}`);
  }

  const session = await response.json();
  return session.data;
}

/**
 * Cleanup: Deletar todos os dados de teste
 * 
 * Chama em ordem reversa de dependências:
 * 1. AnnotationEndorsements
 * 2. MatchAnnotationSessions
 * 3. PointLogs
 * 4. Matches
 * 5. Players
 */
export async function cleanupTestData(api: APIRequestContext) {
  const { api: adminApi } = await loginAs('admin');

  try {
    // Deletar endorsements
    await adminApi.delete('/api/admin/cleanup/endorsements');
  } catch {
    // Ignora se endpoint não existir
  }

  try {
    // Deletar sessions
    await adminApi.delete('/api/admin/cleanup/sessions');
  } catch {
    // Ignora se endpoint não existir
  }

  try {
    // Deletar point logs
    await adminApi.delete('/api/admin/cleanup/point-logs');
  } catch {
    // Ignora se endpoint não existir
  }

  try {
    // Deletar matches
    await adminApi.delete('/api/admin/cleanup/matches');
  } catch {
    // Ignora se endpoint não existir
  }

  try {
    // Deletar players (exceto admins)
    await adminApi.delete('/api/admin/cleanup/players');
  } catch {
    // Ignora se endpoint não existir
  }
}

/**
 * Helper: Aguardar tempo mínimo (evita race conditions)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper: Aguardar elemento estar visível
 */
export async function waitForElement(page: any, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Helper: Aguardar resposta de API
 */
export async function waitForApiResponse(page: any, urlPattern: string, timeout = 5000) {
  return page.waitForResponse(response => {
    return response.url().includes(urlPattern) && response.status() === 200;
  }, { timeout });
}