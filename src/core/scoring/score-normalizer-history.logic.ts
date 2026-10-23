export function parseRawScoreState(rawScoreState: unknown): Record<string, unknown> | null {
  if (!rawScoreState) return null;
  let parsed = rawScoreState as Record<string, unknown>;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed as string);
    } catch {
      return null;
    }
  }
  // Snapshot serializado contém { state, history } — extrair só o state.
  if (parsed?.state && Array.isArray(parsed?.history)) {
    parsed = parsed.state as Record<string, unknown>;
  }
  return parsed;
}

/**
 * Extrai o array history do rawScoreState (antes de extrair só o state).
 * Usado para reconstruir tiebreakScore de sets corrompidos.
 */
export function extractHistory(rawScoreState: unknown): Record<string, unknown>[] | null {
  if (!rawScoreState) return null;
  let parsed = rawScoreState as Record<string, unknown>;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed as string);
    } catch {
      return null;
    }
  }
  if (parsed?.state && Array.isArray(parsed?.history)) {
    return parsed.history;
  }
  return null;
}

/**
 * Tenta reconstruir o tiebreakScore de um set a partir do history.
 *
 * Procura de trás pra frente o último stateBefore onde o set no índice
 * `setIndex` tinha isTiebreak: true e tiebreakScore preenchido.
 */
export function reconstructTiebreakFromHistory(
  history: Record<string, unknown>[] | null,
  setIndex: number,
): { player1: number; player2: number } | null {
  if (!history || !Array.isArray(history)) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    const stateBefore = entry?.stateBefore as Record<string, unknown> | undefined;
    const sets = stateBefore?.sets as Record<string, unknown>[] | undefined;
    if (!Array.isArray(sets)) continue;
    const set = sets[setIndex];
    if (set && set.isTiebreak && set.tiebreakScore) {
      const tb = set.tiebreakScore as { player1: number; player2: number };
      return { player1: tb.player1, player2: tb.player2 };
    }
  }
  return null;
}
