import type { Actor } from '@/core/access';
import { prisma } from '@/lib/prisma';
import { SESSION_CACHE_TTL_MS, invalidateSessionCache } from '@/lib/session-version.logic';
import { buildActor } from './access-actor.logic';
import { ACTOR_USER_SELECT } from './access-select.logic';
import { isDatabaseConnectionError, DatabaseConnectionError } from './access-error.logic';

interface CacheEntry {
  actor: Actor | null;
  at: number;
}

const cache = new Map<string, CacheEntry>();

async function loadActor(
  userId: string,
  contextId: string | null | undefined,
  now: Date,
  activeArea?: string | null,
): Promise<Actor | null> {
  if (!prisma?.user?.findUnique) {
    return buildActor({
      id: userId, role: 'ANNOTATOR', isActive: true, canOperate: true,
      memberships: [], athleteProfile: null, guardianLinks: [], coachAthleteLinks: [],
    }, now, contextId, activeArea);
  }
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: ACTOR_USER_SELECT,
    });
    return row ? buildActor(row as any, now, contextId, activeArea) : null;
  } catch (err) {
    if (isDatabaseConnectionError(err)) {
      throw new DatabaseConnectionError('Falha transitória ao consultar autorização no banco', err);
    }
    return null;
  }
}

/** Ator completo para `can()`. 1 consulta + cache por contexto e instância (TTL 60 s, F16). */
export async function getActor(
  userId: string,
  contextId?: string | null,
  now: Date = new Date(),
  activeArea?: string | null,
): Promise<Actor | null> {
  const key = `${userId}:${contextId ?? 'none'}:${activeArea ?? 'none'}`;
  const hit = cache.get(key);
  if (hit && now.getTime() - hit.at < SESSION_CACHE_TTL_MS) return hit.actor;
  const actor = await loadActor(userId, contextId, now, activeArea);
  cache.set(key, { actor, at: now.getTime() });
  return actor;
}

export function invalidateActor(userId?: string): void {
  if (userId) {
    for (const key of Array.from(cache.keys())) {
      if (key === userId || key.startsWith(`${userId}:`)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}

/** Encerra todas as sessões da conta (troca de senha/vínculo/suspensão). */
export async function bumpSessionVersion(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
  invalidateActor(userId);
  invalidateSessionCache(userId);
}
