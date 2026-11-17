import type { ClubMatchItem } from './types';
import type { DashboardMatchPayload } from '@/components/dashboard/match-card-types';

export function clubMatchToDashboardPayload(m: ClubMatchItem): DashboardMatchPayload {
  return {
    id: m.id,
    state: m.state,
    format: m.format,
    matchType: m.matchType,
    courtType: m.courtType ?? null,
    ctId: m.ctId ?? null,
    player1: {
      id: m.player1?.id,
      name: m.player1?.name || 'Jogador 1',
      club: m.player1?.club ?? null,
    },
    player2: {
      id: m.player2?.id,
      name: m.player2?.name || 'Jogador 2',
      club: m.player2?.club ?? null,
    },
    player1Partner: m.player1Partner
      ? {
          id: m.player1Partner.id,
          name: m.player1Partner.name,
          club: m.player1Partner.club ?? null,
        }
      : null,
    player2Partner: m.player2Partner
      ? {
          id: m.player2Partner.id,
          name: m.player2Partner.name,
          club: m.player2Partner.club ?? null,
        }
      : null,
    scheduledAt: m.scheduledAt ?? null,
    scoreState: m.scoreState,
    tournamentName: m.tournamentName ?? null,
    category: m.category ?? null,
    round: m.round ?? null,
    bracketType: m.bracketType ?? null,
    temperature: m.temperature ?? null,
    humidity: m.humidity ?? null,
    visibility: m.visibility ?? 'PUBLIC',
    details: m.details ?? null,
    clubName: m.clubName ?? null,
    version: m.version ?? 0,
    createdByUserId: m.createdByUserId,
    createdByUser: m.createdByUser ? { name: m.createdByUser.name } : null,
    isTemplate: m.isTemplate,
    isPublicTemplate: m.isPublicTemplate,
    sourceMatchId: m.sourceMatchId ?? null,
  };
}

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
    if (res.ok) {
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

