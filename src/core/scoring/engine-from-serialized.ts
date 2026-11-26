import type { ScoringEngineConfig, ScoringState, HistoryEntry } from './types';
import { normalizeServer, correctInitialServer } from './engine-server-fix.logic';

export { initialServerSide, isInitialServerCorrectionWindow } from './engine-server-fix.logic';

export function parseSerializedEnginePayload(
  serialized: string,
  config: ScoringEngineConfig,
): { state: ScoringState; history: HistoryEntry[] } {
  let state: ScoringState;
  let history: HistoryEntry[] = [];
  const parsed = JSON.parse(serialized);
  if (parsed.state && Array.isArray(parsed.history)) {
    state = parsed.state as ScoringState;
    history = parsed.history as HistoryEntry[];
  } else {
    state = parsed as ScoringState;
  }

  normalizeServer(state, config);
  correctInitialServer(state, config, history);

  return { state, history };
}
