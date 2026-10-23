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
