import { resolvePlayerDisplayName } from '../access/minor-name-resolver';
import type { SpectatorView, SpectatorPoint, SpectatorMarker, SpectatorScore } from './types';

export interface RawPlayerInput {
  id: string;
  name: string;
  birthDate?: Date | string | null;
}

export interface ToSpectatorViewParams {
  match: {
    id: string;
    state: string;
    format: string;
    matchType: 'SINGLES' | 'DOUBLES';
    startedAt?: Date | string | null;
    finishedAt?: Date | string | null;
    tournamentName?: string | null;
    category?: string | null;
    courtType?: string | null;
    finishReason?: string | null;
  };
  player1: RawPlayerInput;
  player2: RawPlayerInput;
  player1Partner?: RawPlayerInput | null;
  player2Partner?: RawPlayerInput | null;
  score: SpectatorScore;
  points: SpectatorPoint[];
  markers?: SpectatorMarker[];
  annotatorName?: string | null;
  broadcastConsentPlayerIds?: string[];
  guardianPlayerIds?: string[];
  isViewerDirectlyInvolved?: boolean;
  nowDate?: Date;
}

/**
 * Converte dados brutos de partida em SpectatorView estritamente lista-branca.
 * Remove comentários, notas privadas, áudios e anonimiza nomes de menores
 * para terceiros/espectadores não diretamente envolvidos (ECA Digital / LGPD).
 */
export function toSpectatorView(params: ToSpectatorViewParams): SpectatorView {
  const {
    match, player1, player2, player1Partner, player2Partner, score, points,
    markers = [], annotatorName, guardianPlayerIds = [],
    isViewerDirectlyInvolved = false, nowDate = new Date(),
  } = params;

  const isInvolved = (pId: string) => isViewerDirectlyInvolved || guardianPlayerIds.includes(pId);
  const getPlayerName = (p: RawPlayerInput) =>
    resolvePlayerDisplayName({ player: p, matchId: match.id, isDirectlyInvolved: isInvolved(p.id), now: nowDate });

  const side1Members = [{ id: player1.id, name: getPlayerName(player1) }];
  if (player1Partner) side1Members.push({ id: player1Partner.id, name: getPlayerName(player1Partner) });

  const side2Members = [{ id: player2.id, name: getPlayerName(player2) }];
  if (player2Partner) side2Members.push({ id: player2Partner.id, name: getPlayerName(player2Partner) });

  return {
    match: {
      id: match.id,
      state: match.state,
      format: match.format,
      matchType: match.matchType,
      startedAt: match.startedAt ? new Date(match.startedAt).toISOString() : null,
      finishedAt: match.finishedAt ? new Date(match.finishedAt).toISOString() : null,
      sides: [
        { label: side1Members.map((m) => m.name).join(' / '), members: side1Members },
        { label: side2Members.map((m) => m.name).join(' / '), members: side2Members },
      ],
      tournamentName: match.tournamentName ?? null,
      category: match.category ?? null,
      courtType: match.courtType ?? null,
      annotatorName: annotatorName ?? null,
      finishReason: match.finishReason ?? null,
    },
    score,
    points,
    markers,
  };
}
