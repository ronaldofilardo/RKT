import type { ScoringEngineConfig, ScoringState, PointFlow, PointDetails, HistoryEntry, DoublesArrangement } from './types';
import { logger } from '@/lib/logger';
import { createInitialState, getState, serialize, reconcileWithCanonicalState } from './engine.state';
import { saveToHistory, undoLastPoint as undoHistory, getHistoryLength, getPointHistory, restorePointHistory, clearHistory } from './engine.history';
import {
  applyRegularPoint as applyRegularPointFlow,
  applyTiebreakPoint as applyTiebreakPointToGame,
  applyMatchTiebreak as applyMatchTiebreakFlow,
  isMatchTiebreakActive,
} from './engine.flow';
import { buildPointDetails } from './engine-point-details';
import { unwrapStateEnvelope } from './state-envelope';
import { sideOfPlayer, getServingMemberId, getReceiverMemberId,  } from './doubles';

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

  if (config.doubles) {
    const side = sideOfPlayer(config.doubles, flow.winnerId);
    if (side) return side;
  }

  logger.error('[ScoringEngine] applyPoint: invalid winnerId', {
    winnerId: flow.winnerId,
    player1Id: config.player1Id,
    player2Id: config.player2Id,
    type: flow.type,
  });
  throw new Error('INVALID_WINNER');
}

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

    if (!this.state.startedAt) {
      this.state.startedAt = flow.timestamp || Date.now();
    }

    const isFaultFirst = Boolean(flow.type === 'FAULT_FIRST' || flow.firstFault);
    const winner = resolveWinner(flow, this.config, isFaultFirst);
    const isSecondServeState = Boolean(this.state.secondServe || this.state.currentGame?.secondServe);
    const details = buildPointDetails(flow, this.state, this.config, isSecondServeState);

    if (flow.type === 'DOUBLE_FAULT') {
      this.state = this.recordDoubleFault(winner, details);
      return getState(this.state);
    }

    if (isFaultFirst) {
      return this.recordFirstServeFault(this.state.server, details);
    }

    saveToHistory(this.history, this.state, details);

    this.state = this.applyResolvedPoint(winner);
    return getState(this.state);
  }

  private recordFirstServeFault(_winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    saveToHistory(this.history, this.state, details);
    this.state.currentGame.secondServe = true;
    this.state.secondServe = true;
    return getState(this.state);
  }

  private recordDoubleFault(winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    saveToHistory(this.history, this.state, details);
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;
    return this.applyResolvedPoint(winner);
  }

  private applyResolvedPoint(winner: 'player1' | 'player2'): ScoringState {
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;

    if (isMatchTiebreakActive(this.state, this.config)) {
      return applyMatchTiebreakFlow(winner, this.state, this.config);
    }

    const currentSet = this.state.sets[this.state.sets.length - 1];
    if (currentSet?.isTiebreak) {
      return applyTiebreakPointToGame(this.state, winner, this.config);
    }

    return applyRegularPointFlow(winner, this.state, this.config);
  }

  undoLastPoint(): { point: PointDetails } | null {
    const result = undoHistory(this.history);
    if (result) {
      this.state = result.stateBefore;
      return { point: result.point };
    }
    return null;
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

  getServingMemberId(): string | null {
    if (!this.config.doubles) return null;
    return getServingMemberId(this.state, this.config.doubles);
  }

  getReceiverMemberId(override?: string): string | null {
    if (!this.config.doubles) return null;
    return getReceiverMemberId(this.state, this.config.doubles, override);
  }

  setArrangement(arrangement: DoublesArrangement): void {
    if (this.config.doubles) {
      this.state.doubles = arrangement;
    }
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

  loadState(newState: ScoringState | unknown): void {
    const raw = typeof newState === 'string' ? JSON.parse(newState) : newState;
    const unpacked = unwrapStateEnvelope(raw);
    this.state = JSON.parse(JSON.stringify(unpacked));
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

    // `state.server` é tipado como 'player1' | 'player2', mas dados legados
    // gravavam o userId cru. Alarga para string apenas para a comparação.
    const rawServer = state.server as string;
    if (rawServer === config.player2Id) {
      state.server = 'player2';
    } else if (rawServer === config.player1Id) {
      state.server = 'player1';
    } else if (rawServer !== 'player1' && rawServer !== 'player2') {
      state.server = config.initialServerId === config.player2Id ? 'player2' : 'player1';
    }

    const totalCompletedGames = (state.sets ?? []).reduce(
      (acc, s) => acc + (s.player1 || 0) + (s.player2 || 0),
      0
    );
    const hasCurrentGamePoints = Boolean(
      state.currentGame && (
        state.currentGame.player1 > 0 ||
        state.currentGame.player2 > 0 ||
        Boolean(state.currentGame.advantage) ||
        state.currentGame.secondServe
      )
    );
    const hasTiebreakPoints = Boolean(
      (state.sets ?? []).some(
        (s) => s.tiebreakScore && (s.tiebreakScore.player1 > 0 || s.tiebreakScore.player2 > 0)
      )
    );
    const isVirginState =
      config.format !== 'MATCH_TB_10' &&
      totalCompletedGames === 0 &&
      !hasCurrentGamePoints &&
      !hasTiebreakPoints &&
      history.length === 0 &&
      state.startedAt == null;

    const isGame1 = config.format !== 'MATCH_TB_10' && totalCompletedGames === 0 && !hasTiebreakPoints;
    if (isGame1 && config.initialServerId === config.player2Id && state.server === 'player1') {
      state.server = 'player2';
    } else if (isVirginState && config.initialServerId) {
      state.server = config.initialServerId === config.player2Id ? 'player2' : 'player1';
    }

    const engine = new ScoringEngine(config, state);
    if (history.length > 0) {
      engine.restorePointHistory(history);
    }
    return engine;
  }
}