import type { ScoringEngineConfig, ScoringState, PointFlow, PointDetails, HistoryEntry } from './types';
import { logger } from '@/lib/logger';
import { createInitialState, getState, serialize, reconcileWithCanonicalState } from './engine.state';
import { saveToHistory, undoLastPoint as undoHistory, replayCurrentPoint as replayHistory, getHistoryLength, getPointHistory, restorePointHistory, clearHistory } from './engine.history';
import {
  processRegularPoint as processRegularPointFlow,
  processTiebreakPoint as processTiebreakPointHandler,
  processMatchTiebreak as processMatchTiebreakFlow,
  isMatchTiebreakActive,
} from './engine.flow';

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
    if (this.state.isFinished) {
      throw new Error('MATCH_ALREADY_FINISHED');
    }

    const isFaultFirst = flow.type === 'FAULT_FIRST' || flow.firstFault;

    const winner: 'player1' | 'player2' | null =
      isFaultFirst ? null :
      (flow.winnerId === this.config.player1Id ? 'player1' :
       flow.winnerId === this.config.player2Id ? 'player2' : null);

    if (!isFaultFirst && winner === null) {
      logger.error('[ScoringEngine] applyPoint: invalid winnerId', {
        winnerId: flow.winnerId,
        player1Id: this.config.player1Id,
        player2Id: this.config.player2Id,
        type: flow.type,
      });
      throw new Error('INVALID_WINNER');
    }

    const details: PointDetails = {
      winnerId: flow.winnerId,
      type: (flow.type as PointDetails['type']) || 'WINNER',
      isFirstServe: flow.isFirstServe ?? true,
      isSecondServe: flow.isSecondServe ?? false,
      isLet: false,
      serverId: flow.serverId,
      timestamp: flow.timestamp ?? Date.now(),
      rallyDetails: flow.rallyDetails ?? null,
      rallyLength: flow.rallyLength ?? 0,
      firstFaultDetail: flow.firstFaultDetail ?? null,
    };

    if (flow.type === 'DOUBLE_FAULT') {
      const newState = this.handleDoubleFault(winner!, details);
      this.state = newState;
      return getState(this.state);
    }

    if (isFaultFirst) {
      return this.handleFirstServeFault(winner ?? this.state.server, details);
    }

    saveToHistory(this.history, this.state, details);

    const newState = this.processPoint(winner!);
    this.state = newState;
    return getState(this.state);
  }

  private handleFirstServeFault(_winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    saveToHistory(this.history, this.state, details);
    this.state.currentGame.secondServe = true;
    this.state.secondServe = true;
    return getState(this.state);
  }

  private handleDoubleFault(winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    saveToHistory(this.history, this.state, details);
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;
    return this.processPoint(winner);
  }

  private processPoint(winner: 'player1' | 'player2'): ScoringState {
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;

    if (isMatchTiebreakActive(this.state, this.config)) {
      return processMatchTiebreakFlow(winner, this.state);
    }

    const currentSet = this.state.sets[this.state.sets.length - 1];
    if (currentSet?.isTiebreak) {
      return processTiebreakPointHandler(this.state, winner, this.config);
    }

    return processRegularPointFlow(winner, this.state, this.config);
  }

  undoLastPoint(): PointDetails | null {
    return undoHistory(this.history, (newState) => { this.state = newState; });
  }

  replayCurrentPoint(): void {
    replayHistory(this.history, (newState) => { this.state = newState; });
  }

  getHistoryLength(): number {
    return getHistoryLength(this.history);
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
  }

  clearHistory(): void {
    clearHistory(this.history);
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