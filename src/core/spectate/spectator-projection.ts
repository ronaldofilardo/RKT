import { maskNameForMinor } from '../access/pool';
import { isMinor } from '../access/age';
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
  guardianPlayerIds?: string[];
  nowDate?: Date;
}

function resolvePlayerName(player: RawPlayerInput, guardianIds: string[], now: Date): string {
  const isPlayerMinor = isMinor(player.birthDate ? new Date(player.birthDate) : null, now);
  if (isPlayerMinor && !guardianIds.includes(player.id)) {
    return maskNameForMinor(player.name);
  }
  return player.name;
}

/**
 * Converte dados brutos de partida em SpectatorView estritamente lista-branca.
 * Remove comentários, notas privadas, áudios e mascara nomes de menores para não responsáveis.
 */
export function toSpectatorView(params: ToSpectatorViewParams): SpectatorView {
  const { match, player1, player2, player1Partner, player2Partner, score, points, markers = [], annotatorName, guardianPlayerIds = [], nowDate = new Date() } = params;

  const p1Name = resolvePlayerName(player1, guardianPlayerIds, nowDate);
  const p2Name = resolvePlayerName(player2, guardianPlayerIds, nowDate);

  const side1Members = [{ id: player1.id, name: p1Name }];
  if (player1Partner) {
    side1Members.push({ id: player1Partner.id, name: resolvePlayerName(player1Partner, guardianPlayerIds, nowDate) });
  }

  const side2Members = [{ id: player2.id, name: p2Name }];
  if (player2Partner) {
    side2Members.push({ id: player2Partner.id, name: resolvePlayerName(player2Partner, guardianPlayerIds, nowDate) });
  }

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

