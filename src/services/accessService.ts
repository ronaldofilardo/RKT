import type { Actor } from '@/core/access';
import { prisma } from '@/lib/prisma';
import { SESSION_CACHE_TTL_MS, invalidateSessionCache } from '@/lib/session-version.logic';
import { buildActor } from './access-actor.logic';

interface CacheEntry {
  actor: Actor | null;
  at: number;
}

const cache = new Map<string, CacheEntry>();

async function loadActor(userId: string, now: Date): Promise<Actor | null> {
  if (!prisma?.user?.findUnique) {
    return buildActor({
      id: userId,
      role: 'ANNOTATOR',
      isActive: true,
      canOperate: true,
      memberships: [],
      athleteProfile: null,
      guardianLinks: [],
      coachAthleteLinks: [],
    }, now);
  }
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        canOperate: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: { kind: true, preset: true, ctId: true, status: true },
        },
        athleteProfile: { select: { id: true, playerCts: { select: { ctId: true } } } },
        guardianLinks: {
          where: { revokedAt: null, confirmedAt: { not: null } },
          select: {
            confirmedAt: true,
            revokedAt: true,
            player: { select: { id: true, birthDate: true } },
          },
        },
        coachAthleteLinks: {
          where: { status: 'ACTIVE' },
          select: { playerId: true },
        },
      },
    });
    return row ? buildActor(row, now) : null;
  } catch {
    return null;
  }
}

/**
 * Ator completo para `can()`. 1 consulta + cache por instância (TTL 60 s, F16).
 * `null` = conta inexistente.
 */
export async function getActor(userId: string, now: Date = new Date()): Promise<Actor | null> {
  const hit = cache.get(userId);
  if (hit && now.getTime() - hit.at < SESSION_CACHE_TTL_MS) return hit.actor;
  const actor = await loadActor(userId, now);
  cache.set(userId, { actor, at: now.getTime() });
  return actor;
}

export function invalidateActor(userId?: string): void {
  if (userId) cache.delete(userId);
  else cache.clear();
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
