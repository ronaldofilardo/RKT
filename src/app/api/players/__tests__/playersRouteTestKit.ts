/**
 * Kit de teste compartilhado pelos arquivos route.*.test.ts de /api/players.
 * Fora da coleta do Jest (nao termina em .test.ts).
 */
import { NextRequest } from 'next/server';
import { makeAuthHeaders } from '@/test-helpers/auth';

type Role = 'ANNOTATOR' | 'ADMIN';

export function prismaMock() {
  return { prisma: { player: { findMany: jest.fn(), create: jest.fn() } } };
}

export function playerServiceMock() {
  return { listPlayers: jest.fn(), createPlayer: jest.fn() };
}

export function accessServiceMock() {
  return { getActor: jest.fn() };
}

const ROLE_USER: Record<Role, string> = { ANNOTATOR: 'user-athlete', ADMIN: 'user-admin' };
const headerCache: Partial<Record<Role, Record<string, string>>> = {};

export async function authHeaders(role: Role): Promise<Record<string, string>> {
  headerCache[role] ??= await makeAuthHeaders(ROLE_USER[role], role);
  return headerCache[role]!;
}

export async function getPlayers(url: string, role: Role | null = 'ANNOTATOR') {
  const req = role
    ? new NextRequest(url, { headers: await authHeaders(role) })
    : new NextRequest(url);
  const { GET } = await import('@/app/api/players/route');
  return GET(req);
}

export async function postPlayers(body: unknown, role: Role = 'ANNOTATOR') {
  const req = new NextRequest('http://localhost:3000/api/players', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(await authHeaders(role)) },
  });
  const { POST } = await import('@/app/api/players/route');
  return POST(req);
}

export const athleteActor = {
  userId: 'user-athlete',
  isActive: true,
  canOperate: true,
  memberships: [],
  athletePlayerId: null,
  athleteCtIds: [],
  guardianOfPlayerIds: [],
  followedPlayerIds: [],
};

export const defaultActor = { ...athleteActor, userId: 'user-123' };

export const gestorActor = {
  ...defaultActor,
  memberships: [{ kind: 'GESTOR', preset: null, ctId: 'ct-1', status: 'ACTIVE' }],
};

export const atletaActor = { ...defaultActor, athletePlayerId: 'p-existente', athleteCtIds: ['ct-1'] };

export const inactiveActor = { ...defaultActor, isActive: false };

export function createdPlayer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'Test',
    cpfHash: null,
    cpfLast2: null,
    identityStatus: 'PROVISIONAL',
    athleteCode: 'ABC12345',
    ...overrides,
  };
}

export function createdPlayerWithBirth(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    name: 'Test',
    gender: 'MALE',
    age: 25,
    dominance: 'RIGHT',
    backhand: 'ONE_HANDED',
    ranking: 10,
    rankings: {},
    birthDate: new Date('1999-01-01'),
    ...overrides,
  };
}
