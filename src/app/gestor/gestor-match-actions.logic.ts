import type { ClubMatchItem } from './types';

export async function requestDeleteMatch(match: ClubMatchItem): Promise<boolean> {
  const confirmed = window.confirm('Deseja realmente excluir esta partida?');
  if (!confirmed) return false;

  const url = match.isTemplate || match.isPublicTemplate
    ? `/api/matches/${match.id}/template`
    : `/api/matches/${match.id}`;

  const res = await fetch(url, { method: 'DELETE' });
  return res.ok;
}

export async function requestAnnotateMatch(
  match: ClubMatchItem,
  onNavigate: (path: string) => void,
  onError?: (msg: string) => void,
) {
  const targetId = match.sourceMatchId ?? match.id;
  try {
    const res = await fetch(`/api/matches/pool/${targetId}/annotate`, { method: 'POST' });
    if (res.status === 201) {
      const json = await res.json();
      const matchId = (json as { matchId?: string }).matchId;
      if (matchId) onNavigate(`/match/${matchId}/scoring`);
      return;
    }
    if (res.status === 409) {
      const json = await res.json();
      const matchId = (json as { details?: { matchId?: string } | null })?.details?.matchId;
      if (matchId) onNavigate(`/match/${matchId}/scoring`);
      return;
    }
    const json = await res.json().catch(() => ({}));
    onError?.((json as { message?: string })?.message || 'Não foi possível iniciar anotação.');
  } catch {
    onError?.('Erro ao iniciar anotação.');
  }
}

