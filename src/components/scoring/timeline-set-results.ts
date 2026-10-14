import type { TimelinePoint } from '@/core/scoring/types';
import { isSetDecidingPoint } from './timeline-utils';

export interface SetResult {
  setNumber: number;
  p1: number;
  p2: number;
  tiebreak?: { p1: number; p2: number };
}

/** Forma mínima de set lida por esta extração. */
interface RawSet {
  player1?: number;
  player2?: number;
  isTiebreak?: boolean;
  tiebreakScore?: { player1?: number; player2?: number } | null;
}

/** Envelope `{state, history}` que o scoreState pode trazer. */
interface RawScoreStateEnvelope {
  state?: { sets?: RawSet[] };
  sets?: RawSet[];
}

function parseScoreStateEnvelope(scoreState: unknown): RawScoreStateEnvelope | null {
  if (!scoreState) return null;
  let raw: unknown = scoreState;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== 'object') return null;
  return raw as RawScoreStateEnvelope;
}

function resolveStateSets(envelope: RawScoreStateEnvelope): RawSet[] | null {
  const stateObj =
    envelope.state && typeof envelope.state === 'object' ? envelope.state : envelope;
  const sets = stateObj.sets;
  if (!Array.isArray(sets) || sets.length === 0) return null;
  return sets;
}

function hasAnySetScore(sets: RawSet[]): boolean {
  return sets.some(
    (s) =>
      (s.player1 ?? 0) > 0 ||
      (s.player2 ?? 0) > 0 ||
      Boolean(
        s.tiebreakScore &&
          ((s.tiebreakScore.player1 ?? 0) > 0 || (s.tiebreakScore.player2 ?? 0) > 0),
      ),
  );
}

function toSetResult(s: RawSet, idx: number): SetResult {
  const tb = s.tiebreakScore;
  const hasTb =
    Boolean(s.isTiebreak) ||
    Boolean(tb && ((tb.player1 ?? 0) > 0 || (tb.player2 ?? 0) > 0));
  return {
    setNumber: idx + 1,
    p1: s.player1 ?? 0,
    p2: s.player2 ?? 0,
    tiebreak: hasTb && tb ? { p1: tb.player1 ?? 0, p2: tb.player2 ?? 0 } : undefined,
  };
}

export function extractSetsFromScoreState(scoreState: unknown): SetResult[] | null {
  const envelope = parseScoreStateEnvelope(scoreState);
  if (!envelope) return null;
  const sets = resolveStateSets(envelope);
  if (!sets || !hasAnySetScore(sets)) return null;
  return sets.map(toSetResult);
}

function groupPointsBySet(points: TimelinePoint[]): {
  setOrder: number[];
  bySet: Map<number, TimelinePoint[]>;
} {
  const setOrder: number[] = [];
  const bySet = new Map<number, TimelinePoint[]>();
  for (const p of points) {
    if (!bySet.has(p.setNumber)) {
      setOrder.push(p.setNumber);
      bySet.set(p.setNumber, []);
    }
    bySet.get(p.setNumber)!.push(p);
  }
  return { setOrder, bySet };
}

function computeTiebreakSetResult(
  setNum: number,
  setPoints: TimelinePoint[],
  lastPoint: TimelinePoint,
): SetResult {
  const winner = lastPoint.winner;
  const tbP1 = (lastPoint.gameScore?.player1 ?? 0) + (winner === 'PLAYER_1' ? 1 : 0);
  const tbP2 = (lastPoint.gameScore?.player2 ?? 0) + (winner === 'PLAYER_2' ? 1 : 0);
  const tb = { p1: tbP1, p2: tbP2 };

  const lastRegular = [...setPoints].reverse().find((p) => !p.isTiebreak);
  if (!lastRegular) {
    return {
      setNumber: setNum,
      p1: winner === 'PLAYER_1' ? 1 : 0,
      p2: winner === 'PLAYER_2' ? 1 : 0,
      tiebreak: tb,
    };
  }

  const regWinner = lastRegular.winner;
  const regP1 = lastRegular.gamesScore.player1 + (regWinner === 'PLAYER_1' ? 1 : 0);
  const regP2 = lastRegular.gamesScore.player2 + (regWinner === 'PLAYER_2' ? 1 : 0);
  const baseGames = Math.max(regP1, regP2);
  return {
    setNumber: setNum,
    p1: winner === 'PLAYER_1' ? baseGames + 1 : baseGames,
    p2: winner === 'PLAYER_2' ? baseGames + 1 : baseGames,
    tiebreak: tb,
  };
}

function computeRegularSetResult(
  setNum: number,
  lastPoint: TimelinePoint,
  isGameFinished: boolean,
): SetResult {
  const winner = lastPoint.winner;
  return {
    setNumber: setNum,
    p1: lastPoint.gamesScore.player1 + (isGameFinished && winner === 'PLAYER_1' ? 1 : 0),
    p2: lastPoint.gamesScore.player2 + (isGameFinished && winner === 'PLAYER_2' ? 1 : 0),
  };
}

function computeSetResultFromPoints(
  setNum: number,
  setPoints: TimelinePoint[],
  isLastSet: boolean,
): SetResult | null {
  if (setPoints.length === 0) return null;
  const lastPoint = setPoints[setPoints.length - 1];
  // Se há um set posterior na lista de pontos, o set anterior com certeza encerrou no último ponto.
  // Se é o último set, verifica se o ponto foi definidor de game/set.
  const isGameFinished = !isLastSet || isSetDecidingPoint(lastPoint);
  if (lastPoint.isTiebreak) {
    return computeTiebreakSetResult(setNum, setPoints, lastPoint);
  }
  return computeRegularSetResult(setNum, lastPoint, isGameFinished);
}

export function computeSetResultsFromPoints(points: TimelinePoint[]): SetResult[] {
  if (!points || points.length === 0) return [];
  const { setOrder, bySet } = groupPointsBySet(points);
  const results: SetResult[] = [];
  for (let sIdx = 0; sIdx < setOrder.length; sIdx++) {
    const setNum = setOrder[sIdx];
    const result = computeSetResultFromPoints(
      setNum,
      bySet.get(setNum)!,
      sIdx === setOrder.length - 1,
    );
    if (result) results.push(result);
  }
  return results;
}

export function getSetResults(points: TimelinePoint[], scoreState?: unknown): SetResult[] {
  const fromState = extractSetsFromScoreState(scoreState);
  if (fromState && fromState.length > 0) {
    return fromState;
  }
  return computeSetResultsFromPoints(points);
}
