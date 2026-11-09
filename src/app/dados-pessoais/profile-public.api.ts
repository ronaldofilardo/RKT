export interface PlayerProfileResponse {
  id: string;
  nickname?: string | null;
  poolVisible?: boolean;
  birthDate?: string | null;
  message?: string;
}

export interface VisibilityResponse {
  data?: { poolVisible?: boolean };
  message?: string;
}

/** ID do Player ligado à conta autenticada (null se a conta não é atleta). */
export async function fetchCurrentPlayerId(): Promise<string | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  const me = await res.json();
  return me?.athlete?.playerId ?? me?.athletePlayerId ?? null;
}

export async function fetchPlayerProfile(playerId: string): Promise<PlayerProfileResponse | null> {
  const res = await fetch(`/api/players/${playerId}`);
  return res.ok ? ((await res.json()) as PlayerProfileResponse) : null;
}

export async function requestNicknameSave(playerId: string, nickname: string) {
  const res = await fetch(`/api/players/${playerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: nickname || null }),
  });
  const body = (await res.json().catch(() => ({}))) as PlayerProfileResponse;
  return { status: res.status, body };
}

export async function requestPoolVisibility(playerId: string, visible: boolean) {
  const res = await fetch(`/api/players/${playerId}/pool-visibility`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visible }),
  });
  const body = (await res.json().catch(() => ({}))) as VisibilityResponse;
  return { status: res.status, body };
}
