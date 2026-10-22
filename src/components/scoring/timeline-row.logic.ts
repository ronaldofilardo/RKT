import { GAME_POINTS } from '@/core/scoring/point.logic';
import type { TimelinePoint } from '@/core/scoring/types';
import { getPointDetailSummary } from './timeline.logic';

export type BadgeColor = 'green' | 'red' | 'amber' | 'gray';

export const BADGE_COLORS: Record<BadgeColor, string> = {
  green: 'bg-green-500/20 text-green-400',
  red: 'bg-telemetry-error/20 text-telemetry-error',
  amber: 'bg-telemetry-alert/20 text-telemetry-alert',
  gray: 'bg-white/10 text-telemetry-text-primary',
};

export interface TimelineDoublesConfig {
  player1PartnerName?: string;
  player2PartnerName?: string;
  player1Id?: string;
  player2Id?: string;
  player1PartnerId?: string;
  player2PartnerId?: string;
}

/**
 * Iniciais do atleta para as colunas "P/" e "SAC":
 * - Nome + sobrenome (2+ palavras): iniciais de cada um, ex. "Rafael Nadal" → "R.N.".
 * - Um único nome: as 3 primeiras letras, ex. "Djokovic" → "Djo".
 */
export function getPlayerInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  if (parts.length >= 2) {
    const first = parts[0].charAt(0).toUpperCase();
    const last = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first}.${last}.`;
  }
  const single = parts[0];
  const letters = single.slice(0, 3);
  return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
}

/**
 * Iniciais da equipe de duplas (ex: "RN/RF" ou "Nad/Fed")
 */
export function getTeamInitials(name1: string, name2?: string): string {
  const init1 = getPlayerInitials(name1);
  if (!name2) return init1;
  const init2 = getPlayerInitials(name2);
  const clean1 = init1.replace(/\./g, '');
  const clean2 = init2.replace(/\./g, '');
  return `${clean1}/${clean2}`;
}

/** Evento (PointFlow.type) tem precedência sobre rd.tipo; fallback no rallyDetails. */
export function getPointBadge(p: TimelinePoint): { label: string; color: BadgeColor } {
  if (p.type === 'ACE') return { label: 'Ace', color: 'green' };
  if (p.type === 'DOUBLE_FAULT') return { label: 'DF', color: 'red' };
  if (p.type === 'WINNER') return { label: 'W', color: 'green' };
  if (p.type === 'UNFORCED_ERROR') return { label: 'ENF', color: 'red' };
  if (p.type === 'FORCED_ERROR') return { label: 'EF', color: 'amber' };
  return getPointDetailSummary(p.rallyDetails);
}

export function getGameScoreLabelForPoint(p: TimelinePoint): string {
  if (p.isTiebreak) {
    return `${p.gameScore.player1}x${p.gameScore.player2}`;
  }
  if (p.gameIsDeuce) return 'Deuce';
  if (p.gameAdvantage === 'player1') return 'Adv. P1';
  if (p.gameAdvantage === 'player2') return 'Adv. P2';

  const p1Score = GAME_POINTS[Math.min(p.gameScore.player1, 3)] ?? String(p.gameScore.player1);
  const p2Score = GAME_POINTS[Math.min(p.gameScore.player2, 3)] ?? String(p.gameScore.player2);
  return `${p1Score}-${p2Score}`;
}
