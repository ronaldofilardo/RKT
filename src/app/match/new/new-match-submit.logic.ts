export async function saveOfflineMatch(matchData: Record<string, unknown>): Promise<void> {
  const tempId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { savePendingMatch } = await import('@/lib/offlineDb');
  await savePendingMatch({ tempId, matchData, syncStatus: 'PENDING', createdAt: Date.now() });
}

export async function createMatchRequest(payload: Record<string, unknown>, force = false) {
    const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(force ? { ...payload, force: true } : payload),
  });
  const data = await response.json();
  return { response, data };
}
