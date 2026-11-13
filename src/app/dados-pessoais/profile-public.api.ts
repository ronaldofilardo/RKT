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

export interface CurrentIdentity {
  playerId: string | null;
  name: string;
  cpf: string;
}

/** Dados cadastrais da conta autenticada e ID do Player ligado a ela (se atleta). */
export async function fetchCurrentIdentity(): Promise<CurrentIdentity | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  const me = await res.json();
  return {
    playerId: me?.athlete?.playerId ?? me?.athletePlayerId ?? null,
    name: me?.user?.name ?? '',
    cpf: me?.user?.cpf ?? '',
  };
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

export async function requestPersonalDataSave(name: string) {
  const res = await fetch('/api/users/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const body = (await res.json().catch(() => ({}))) as { success?: boolean; name?: string; message?: string };
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
