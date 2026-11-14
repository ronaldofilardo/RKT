function getRoleWeight(role?: string): number {
  const r = (role || '').toUpperCase();
  if (r.includes('GESTOR')) return 4;
  if (r.includes('TREINADOR') || r.includes('COACH')) return 3;
  if (r.includes('ATLETA')) return 2;
  return 1;
}

export function getMatchSlotKey(payload: {
  player1Name?: string;
  player2Name?: string;
  scheduledAt?: string | Date | null;
}): string {
  const p1 = (payload.player1Name || '').trim().toLowerCase();
  const p2 = (payload.player2Name || '').trim().toLowerCase();
  const pair = [p1, p2].sort().join('::');
  const sched = payload.scheduledAt
    ? new Date(payload.scheduledAt).toISOString().slice(0, 16)
    : '';
  return pair && sched ? `${pair}::${sched}` : '';
}

export function buildDismissedKeys(dismissedNotifs: Array<{ payload: any }>): Set<string> {
  const set = new Set<string>();
  for (const n of dismissedNotifs) {
    const p = (n.payload || {}) as Record<string, any>;
    if (p.matchId) set.add(`id:${p.matchId}`);
    if (p.templateId) set.add(`id:${p.templateId}`);
    const slot = getMatchSlotKey(p);
    if (slot) set.add(`slot:${slot}`);
  }
  return set;
}

export function isMatchDismissed(
  m: { id: string; sourceMatchId?: string | null; scheduledAt?: Date | null; player1?: { name: string } | null; player2?: { name: string } | null },
  dismissedKeys: Set<string>,
): boolean {
  if (dismissedKeys.has(`id:${m.id}`)) return true;
  if (m.sourceMatchId && dismissedKeys.has(`id:${m.sourceMatchId}`)) return true;
  const slot = getMatchSlotKey({
    player1Name: m.player1?.name,
    player2Name: m.player2?.name,
    scheduledAt: m.scheduledAt,
  });
  return Boolean(slot && dismissedKeys.has(`slot:${slot}`));
}

export function deduplicateFeedItems<T extends { payload: any; createdAt: Date | string }>(items: T[]): T[] {
  const map = new Map<string, T>();

  for (const item of items) {
    const p = item.payload || {};
    const slot = getMatchSlotKey(p);
    const key = slot ? `slot:${slot}` : (p.templateId ? `tmpl:${p.templateId}` : `id:${p.matchId}`);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      continue;
    }

    const currentWeight = getRoleWeight(p.creatorRole);
    const existingWeight = getRoleWeight(existing.payload?.creatorRole);

    if (currentWeight > existingWeight) {
      map.set(key, item);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
