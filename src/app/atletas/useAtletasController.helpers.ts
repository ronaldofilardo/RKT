import type { Athlete } from './useAtletasController';

type PlayersResponse = { data?: { players?: Athlete[] }; players?: Athlete[] };

export async function fetchAthletes(userId: string, token: string | null): Promise<Athlete[]> {
  const response = await fetch(`/api/players?userId=${encodeURIComponent(userId)}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || 'Erro ao carregar atletas');
  }
  const json = await response.json() as PlayersResponse;
  const players = json.data?.players ?? json.players ?? [];
  return Array.isArray(players) ? players : [];
}
