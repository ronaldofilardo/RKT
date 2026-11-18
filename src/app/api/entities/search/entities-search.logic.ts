import { prisma } from '@/lib/prisma';

export type EntitySearchType = 'ALL' | 'CT' | 'COACH';

/** Cursor estável em ordem (name, id): o mesmo predicado vale para CT e coach. */
export interface EntitySearchCursor {
  name: string;
  id: string;
}

export interface EntitySearchItem {
  id: string;
  kind: 'CT' | 'COACH';
  name: string;
  detail: string | null;
}

interface SearchParams {
  q: string;
  type: EntitySearchType;
  limit: number;
  cursor: EntitySearchCursor | null;
}

/** DoD Fase 2: busca limitada a 10 resultados por requisição. */
const MAX_LIMIT = 10;

export function decodeCursor(raw: string | null | undefined): EntitySearchCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as EntitySearchCursor;
    return typeof parsed?.name === 'string' && typeof parsed?.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

function encodeCursor(cursor: EntitySearchCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function afterCursor(cursor: EntitySearchCursor | null) {
  if (!cursor) return {};
  return { OR: [{ name: { gt: cursor.name } }, { name: cursor.name, id: { gt: cursor.id } }] };
}

function cityOf(address: unknown): string | null {
  if (address && typeof address === 'object' && 'city' in address) {
    const city = (address as { city?: unknown }).city;
    return typeof city === 'string' && city ? city : null;
  }
  return null;
}

async function searchCts(q: string, cursor: EntitySearchCursor | null, take: number): Promise<EntitySearchItem[]> {
  const rows = await prisma.trainingCenter.findMany({
    where: { status: 'ACTIVE', name: { contains: q, mode: 'insensitive' }, ...afterCursor(cursor) },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take,
    select: { id: true, name: true, address: true },
  });
  return rows.map((ct) => ({ id: ct.id, kind: 'CT' as const, name: ct.name, detail: cityOf(ct.address) }));
}

async function searchCoaches(q: string, cursor: EntitySearchCursor | null, take: number): Promise<EntitySearchItem[]> {
  const rows = await prisma.user.findMany({
    where: {
      isActive: true,
      name: { contains: q, mode: 'insensitive' },
      memberships: { some: { kind: 'TREINADOR', status: 'ACTIVE', ctId: null } },
      ...afterCursor(cursor),
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    take,
    select: { id: true, name: true, club: true },
  });
  return rows.map((u) => ({ id: u.id, kind: 'COACH' as const, name: u.name, detail: u.club }));
}

/** Busca CTs ativos e treinadores particulares (só nome — LGPD, §13.4). */
export async function searchEntities(
  params: SearchParams,
): Promise<{ items: EntitySearchItem[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(params.limit, 1), MAX_LIMIT);
  const take = limit + 1;
  const [cts, coaches] = await Promise.all([
    params.type === 'COACH' ? Promise.resolve([]) : searchCts(params.q, params.cursor, take),
    params.type === 'CT' ? Promise.resolve([]) : searchCoaches(params.q, params.cursor, take),
  ]);
  const merged = [...cts, ...coaches].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const items = merged.slice(0, limit);
  const last = items[items.length - 1];
  const nextCursor = merged.length > limit && last ? encodeCursor({ name: last.name, id: last.id }) : null;
  return { items, nextCursor };
}
