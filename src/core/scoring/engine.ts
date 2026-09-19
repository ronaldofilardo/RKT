import type { ScoringEngineConfig, ScoringState, PointFlow, PointDetails, HistoryEntry } from './types';
import { logger } from '@/lib/logger';
import { createInitialState, getState, serialize, reconcileWithCanonicalState } from './engine.state';
import { saveToHistory, undoLastPoint as undoHistory, replayCurrentPoint as replayHistory, getHistoryLength, getPointHistory, restorePointHistory, clearHistory, clearRedoHistory, getRedoLength } from './engine.history';
import {
  processRegularPoint as processRegularPointFlow,
  processTiebreakPoint as processTiebreakPointHandler,
  processMatchTiebreak as processMatchTiebreakFlow,
  isMatchTiebreakActive,
} from './engine.flow';

function resolveWinner(
  flow: PointFlow,
  config: ScoringEngineConfig,
  isFaultFirst: boolean,
): 'player1' | 'player2' {
  if (isFaultFirst) {
    return 'player1';
  }
  if (flow.winnerId === config.player1Id) return 'player1';
  if (flow.winnerId === config.player2Id) return 'player2';

  logger.error('[ScoringEngine] applyPoint: invalid winnerId', {
    winnerId: flow.winnerId,
    player1Id: config.player1Id,
    player2Id: config.player2Id,
    type: flow.type,
  });
  throw new Error('INVALID_WINNER');
}

function computeRallyLength(flow: PointFlow): number {
  if (flow.rallyLength !== undefined) return flow.rallyLength;
  if (flow.type === 'ACE' || flow.type === 'DOUBLE_FAULT') return 1;
  if (flow.rallyDetails?.situacao === 'devolucao') return 2;
  return 0;
}

function buildPointDetails(flow: PointFlow): PointDetails {
  return {
    winnerId: flow.winnerId,
    type: (flow.type as PointDetails['type']) || 'WINNER',
    isFirstServe: flow.isFirstServe ?? true,
    isSecondServe: flow.isSecondServe ?? false,
    isLet: flow.isLet ?? false,
    serverId: flow.serverId,
    timestamp: flow.timestamp ?? Date.now(),
    rallyDetails: flow.rallyDetails ?? null,
    rallyLength: computeRallyLength(flow),
    firstFaultDetail: flow.firstFaultDetail ?? null,
  };
}

export class ScoringEngine {
  private state: ScoringState;
  private config: ScoringEngineConfig;
  private history: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  constructor(config: ScoringEngineConfig, initialState?: ScoringState) {
    this.config = config;
    this.state = initialState ?? createInitialState(config);
  }

  setStartedAt(time: number): void {
    this.state.startedAt = time;
  }

  applyPoint(flow: PointFlow): ScoringState {
    if (this.state.isFinished) {
      throw new Error('MATCH_ALREADY_FINISHED');
    }

    const isFaultFirst = Boolean(flow.type === 'FAULT_FIRST' || flow.firstFault);
    const winner = resolveWinner(flow, this.config, isFaultFirst);
    const details = buildPointDetails(flow);

    if (flow.type === 'DOUBLE_FAULT') {
      this.state = this.handleDoubleFault(winner, details);
      return getState(this.state);
    }

    if (isFaultFirst) {
      return this.handleFirstServeFault(this.state.server, details);
    }

    saveToHistory(this.history, this.state, details);
    clearRedoHistory(this.redoStack);

    this.state = this.processPoint(winner);
    return getState(this.state);
  }

  private handleFirstServeFault(_winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    saveToHistory(this.history, this.state, details);
    clearRedoHistory(this.redoStack);
    this.state.currentGame.secondServe = true;
    this.state.secondServe = true;
    return getState(this.state);
  }

  private handleDoubleFault(winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    saveToHistory(this.history, this.state, details);
    clearRedoHistory(this.redoStack);
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;
    return this.processPoint(winner);
  }

  private processPoint(winner: 'player1' | 'player2'): ScoringState {
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;

    if (isMatchTiebreakActive(this.state, this.config)) {
      return processMatchTiebreakFlow(winner, this.state, this.config);
    }

    const currentSet = this.state.sets[this.state.sets.length - 1];
    if (currentSet?.isTiebreak) {
      return processTiebreakPointHandler(this.state, winner, this.config);
    }

    return processRegularPointFlow(winner, this.state, this.config);
  }

  undoLastPoint(): { point: PointDetails } | null {
    const result = undoHistory(this.history, this.redoStack, this.state);
    if (result) {
      this.state = result.stateBefore;
      return { point: result.point };
    }
    return null;
  }

  /** @deprecated Redo feature disabled (TD-032) — kept for potential future re-enablement. */
  replayCurrentPoint(): { point: PointDetails } | null {
    const result = replayHistory(this.redoStack, this.history, this.state);
    if (result) {
      this.state = result.stateBefore;
      return { point: result.point };
    }
    return null;
  }

  getHistoryLength(): number {
    return getHistoryLength(this.history);
  }

  getRedoLength(): number {
    return getRedoLength(this.redoStack);
  }

  getState(): Readonly<ScoringState> {
    return getState(this.state);
  }

  isFinished(): boolean {
    return this.state.isFinished;
  }

  getWinner(): 'player1' | 'player2' | null {
    return this.state.winner;
  }

  getServer(): 'player1' | 'player2' {
    return this.state.server;
  }

  getPointHistory(): HistoryEntry[] {
    return getPointHistory(this.history);
  }

  restorePointHistory(history: HistoryEntry[]): void {
    restorePointHistory(this.history, history);
  }

  reconcileWithCanonicalState(canonicalState: ScoringState, canonicalVersion: number): void {
    const result = reconcileWithCanonicalState(this.state, this.history, canonicalState, canonicalVersion);
    this.state = result.state;
    this.history = result.history;
  }

  loadState(newState: ScoringState): void {
    this.state = JSON.parse(JSON.stringify(newState));
    this.history = [];
    this.redoStack = [];
  }

  clearHistory(): void {
    clearHistory(this.history);
    clearRedoHistory(this.redoStack);
  }

  serialize(): string {
    return serialize(this.state, this.history);
  }

  static fromSerialized(config: ScoringEngineConfig, serialized: string): ScoringEngine {
    let state: ScoringState;
    let history: HistoryEntry[] = [];
    const parsed = JSON.parse(serialized);
    if (parsed.state && Array.isArray(parsed.history)) {
      state = parsed.state as ScoringState;
      history = parsed.history as HistoryEntry[];
    } else {
      state = parsed as ScoringState;
    }
    const engine = new ScoringEngine(config, state);
    if (history.length > 0) {
      engine.restorePointHistory(history);
    }
    return engine;
  }
}