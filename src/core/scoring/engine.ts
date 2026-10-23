import type { ScoringEngineConfig, ScoringState, PointFlow, PointDetails, HistoryEntry, DoublesArrangement } from './types';
import { createInitialState, getState, serialize, reconcileWithCanonicalState } from './engine.state';
import { undoLastPoint as undoHistory, getHistoryLength, getPointHistory, restorePointHistory, clearHistory } from './engine.history';
import { parseSerializedEnginePayload } from './engine-from-serialized';
import { processPointFlow } from './engine-apply-point';
import { unwrapStateEnvelope } from './state-envelope';
import { getServingMemberId, getReceiverMemberId } from './doubles';

export class ScoringEngine {
  private state: ScoringState;
  private config: ScoringEngineConfig;
  private history: HistoryEntry[] = [];

  constructor(config: ScoringEngineConfig, initialState?: ScoringState) {
    this.config = config;
    this.state = initialState ?? createInitialState(config);
  }

  setStartedAt(time: number): void {
    this.state.startedAt = time;
  }

  applyPoint(flow: PointFlow): ScoringState {
    if (this.state.isFinished) throw new Error('MATCH_ALREADY_FINISHED');
    if (!this.state.startedAt) this.state.startedAt = flow.timestamp || Date.now();
    this.state = processPointFlow(this.config, this.state, this.history, flow);
    return getState(this.state);
  }

  undoLastPoint(): { point: PointDetails } | null {
    const result = undoHistory(this.history);
    if (!result) return null;
    this.state = result.stateBefore;
    return { point: result.point };
  }

  getHistoryLength(): number { return getHistoryLength(this.history); }

  getState(): Readonly<ScoringState> { return getState(this.state); }

  isFinished(): boolean { return this.state.isFinished; }

  getWinner(): 'player1' | 'player2' | null { return this.state.winner; }

  getServer(): 'player1' | 'player2' { return this.state.server; }

  getServingMemberId(): string | null {
    if (!this.config.doubles) return null;
    return getServingMemberId(this.state, this.config.doubles);
  }

  getReceiverMemberId(override?: string): string | null {
    if (!this.config.doubles) return null;
    return getReceiverMemberId(this.state, this.config.doubles, override);
  }

  setArrangement(arrangement: DoublesArrangement): void {
    if (this.config.doubles) this.state.doubles = arrangement;
  }

  getPointHistory(): HistoryEntry[] { return getPointHistory(this.history); }

  restorePointHistory(history: HistoryEntry[]): void { restorePointHistory(this.history, history); }

  reconcileWithCanonicalState(canonicalState: ScoringState, canonicalVersion: number): void {
    const result = reconcileWithCanonicalState(this.state, this.history, canonicalState, canonicalVersion);
    this.state = result.state;
    this.history = result.history;
  }

  loadState(newState: ScoringState | unknown): void {
    const raw = typeof newState === 'string' ? JSON.parse(newState) : newState;
    this.state = JSON.parse(JSON.stringify(unwrapStateEnvelope(raw)));
    this.history = [];
  }

  clearHistory(): void { clearHistory(this.history); }

  serialize(): string { return serialize(this.state, this.history); }

  static fromSerialized(config: ScoringEngineConfig, serialized: string): ScoringEngine {
    const { state, history } = parseSerializedEnginePayload(serialized, config);
    const engine = new ScoringEngine(config, state);
    engine.restorePointHistory(history);
    return engine;
  }
}
