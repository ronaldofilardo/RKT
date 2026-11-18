import { normalizeScoreState, isMatchTiebreakFormat, isCurrentSetMatchTiebreak, type TennisFormat, type NormalizedScoreState, type SetCellScore } from './match-card.logic';
import type { DashboardMatchPayload } from './match-card-types';

const COURT_COLORS: Record<string, { bar: string; score: string }> = {
  CLAY:  { bar: 'rgb(var(--telemetry-court-clay, 196 98 58))', score: 'rgb(var(--telemetry-court-clay, 196 98 58) / 0.7)' },
  GRASS: { bar: 'rgb(var(--telemetry-court-grass, 45 138 62))', score: 'rgb(var(--telemetry-court-grass, 45 138 62) / 0.7)' },
  HARD:  { bar: 'rgb(var(--telemetry-court-hard, 30 77 123))', score: 'rgb(var(--telemetry-court-hard, 30 77 123) / 0.7)' },
};
const DEFAULT_COURT_COLOR = { bar: 'rgb(var(--telemetry-court-hard, 30 77 123))', score: 'rgb(var(--telemetry-court-hard, 30 77 123) / 0.7)' };

export function resolveScoreState(match: DashboardMatchPayload): NormalizedScoreState | null {
  if (match.scoreSummary) return match.scoreSummary as NormalizedScoreState;
  const fromScoreState = normalizeScoreState(match.scoreState, match.format as TennisFormat);
  return fromScoreState || normalizeScoreState(match.matchStateSnapshot, match.format as TennisFormat);
}

export function parseSuspendedScore(matchStateSnapshot?: string | null): any {
  if (!matchStateSnapshot) return null;
  try {
    const raw = JSON.parse(matchStateSnapshot);
    return raw?.state && Array.isArray(raw?.history) ? raw.state : raw;
  } catch {
    return null;
  }
}

export function resolveDisplayedSets(
  rawSets: SetCellScore[] | undefined,
  format?: string,
  isFinished?: boolean,
): SetCellScore[] {
  const sets = rawSets || [];
  if (format === 'SHORT_SET_2V2_NO_AD' && !isFinished) {
    const placeholder: SetCellScore = { player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null };
    if (sets.length === 0) return [placeholder, placeholder];
    if (sets.length === 1) return [sets[0], placeholder];
  }
  return sets;
}

export function resolveCurrentServer(
  scoreServer: string | null | undefined,
  initialServerId: string | null | undefined,
  match: DashboardMatchPayload,
): 'player1' | 'player2' | null {
  const s = scoreServer || initialServerId;
  if (!s) return null;
  if (s === 'player1' || s === 'player2') return s;
  if (s === match.player1?.id || s === match.player1Partner?.id) return 'player1';
  if (s === match.player2?.id || s === match.player2Partner?.id) return 'player2';
  return null;
}

export function resolveTiebreakDetails(format: string, displayedSets: SetCellScore[]) {
  const isCurrentSetMT = isMatchTiebreakFormat(format) && displayedSets.length > 0
    ? isCurrentSetMatchTiebreak(displayedSets, format as TennisFormat)
    : false;
  const lastSet = displayedSets.length > 0 ? displayedSets[displayedSets.length - 1] : null;
  const lastSetTiebreakScore = !isCurrentSetMT && lastSet?.isTiebreak && lastSet?.tiebreakScore
    ? lastSet.tiebreakScore
    : null;
  return { isCurrentSetMT, lastSetTiebreakScore };
}

export function resolveCardTheme(isSuspended: boolean, courtType?: string | null) {
  if (isSuspended) {
    return { barBg: 'rgb(var(--telemetry-alert, 245 158 11))', scoreBg: 'rgb(var(--telemetry-alert, 217 119 6) / 0.7)' };
  }
  const colors = (courtType && COURT_COLORS[courtType]) || DEFAULT_COURT_COLOR;
  return { barBg: colors.bar, scoreBg: colors.score };
}

export function padSets(
  displayedSets: SetCellScore[],
  isLiveOrSuspended: boolean,
  isFinished: boolean,
  maxSets: number,
): SetCellScore[] {
  if (!isLiveOrSuspended || isFinished) return displayedSets;
  const diff = Math.max(0, maxSets - displayedSets.length);
  const fill = Array.from({ length: diff }, () => ({ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }));
  return [...displayedSets, ...fill];
}

export function resolveServerDisplay(showServer: boolean, currentServer: string | null) {
  return {
    isServerP1: showServer && currentServer === 'player1',
    isServerP2: showServer && currentServer === 'player2',
  };
}
