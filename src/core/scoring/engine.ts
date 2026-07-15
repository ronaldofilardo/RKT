import type { ScoringEngineConfig, ScoringState, PointFlow, PointDetails, GameScore, SetScore, HistoryEntry } from './types';
import {
  processStandardPoint,
  processDeucePoint,
  processTiebreakPoint,
  processMatchTiebreak,
} from './point-handlers';

export class ScoringEngine {
  private state: ScoringState;
  private config: ScoringEngineConfig;
  private history: HistoryEntry[] = [];

  constructor(config: ScoringEngineConfig, initialState?: ScoringState) {
    this.config = config;
    this.state = initialState ?? this.createInitialState();
  }

  private createInitialState(): ScoringState {
    const server = this.config.initialServerId === this.config.player1Id ? 'player1' : 'player2';
    return {
      sets: [],
      currentGame: {
        player1: 0,
        player2: 0,
        isDeuce: false,
        advantage: null,
        secondServe: false,
      },
      server,
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    };
  }

  private saveToHistory(point: PointDetails): void {
    this.history.push({
      stateBefore: JSON.parse(JSON.stringify(this.state)),
      point,
    });
  }

  undoLastPoint(): PointDetails | null {
    if (this.history.length === 0) return null;
    const entry = this.history.pop()!;
    this.state = entry.stateBefore;
    return entry.point;
  }

  replayCurrentPoint(): void {
    const entry = this.history[this.history.length - 1];
    if (!entry) return;
    this.state = JSON.parse(JSON.stringify(entry.stateBefore));
    this.history.pop();
  }

  getHistoryLength(): number {
    return this.history.length;
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
      console.error('[ScoringEngine] applyPoint: invalid winnerId', {
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

    // FIX Bug 3a: FAULT_FIRST and DOUBLE_FAULT both call saveToHistory inside
    // their own handlers — applyPoint must NOT call saveToHistory again before
    // delegating to them (the old code called saveToHistory unconditionally
    // before processPoint, meaning a second-serve winner got recorded twice).
    if (flow.type === 'DOUBLE_FAULT') {
      const newState = this.handleDoubleFault(winner!, details);
      this.state = newState;
      return this.getState();
    }

    if (isFaultFirst) {
      return this.handleFirstServeFault(winner ?? this.state.server, details);
    }

    // Only regular points (winner / forced / unforced) save history here.
    this.saveToHistory(details);

    const newState = this.processPoint(winner!);
    this.state = newState;
    return this.getState();
  }

  private handleFirstServeFault(winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    this.saveToHistory(details);
    this.state.currentGame.secondServe = true;
    this.state.secondServe = true;
    return this.getState();
  }

  private handleDoubleFault(winner: 'player1' | 'player2', details: PointDetails): ScoringState {
    this.saveToHistory(details);
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;
    return this.processPoint(winner);
  }

  private processPoint(winner: 'player1' | 'player2'): ScoringState {
    this.state.secondServe = false;
    this.state.currentGame.secondServe = false;

    // Match Tie-Break detection
    const isMatchTiebreak = 
      this.config.format === 'MATCH_TB_10' ||
      (this.config.format === 'BEST_OF_3_MATCH_TB' && 
       this.state.sets.length === 3 && 
       this.state.sets[2]?.isTiebreak && 
       this.state.sets[2]?.tiebreakScore !== null) ||
      (this.config.format === 'BEST_OF_5' && 
       this.state.sets.length === 5 && 
       this.state.sets[4]?.isTiebreak && 
       this.state.sets[4]?.tiebreakScore !== null) ||
      (this.config.format === 'SHORT_SET_2V2_NO_AD' && 
       this.state.sets.length === 3 && 
       this.state.sets[2]?.isTiebreak && 
       this.state.sets[2]?.tiebreakScore !== null);
    
    if (isMatchTiebreak) {
      return this.processMatchTiebreak(winner);
    }

    const currentSet = this.state.sets[this.state.sets.length - 1];
    if (currentSet?.isTiebreak) {
      return this.processTiebreakPoint(winner);
    }

    return this.processRegularPoint(winner);
  }

  private processMatchTiebreak(winner: 'player1' | 'player2'): ScoringState {
    let set = this.state.sets[0];
    if (!set) {
      set = { player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } };
    }

    const tb = set.tiebreakScore ?? { player1: 0, player2: 0 };
    const newTb = { ...tb };
    if (winner === 'player1') newTb.player1++;
    else newTb.player2++;

    const total = newTb.player1 + newTb.player2;
    const newServer = total % 2 === 0
      ? this.state.server
      : (this.state.server === 'player1' ? 'player2' : 'player1');

    if ((newTb.player1 >= 10 || newTb.player2 >= 10) && Math.abs(newTb.player1 - newTb.player2) >= 2) {
      const setWinner = newTb.player1 > newTb.player2 ? 'player1' : 'player2';
      return this.completeMatchTiebreak(setWinner, newTb, newServer);
    }

    const newSet: SetScore = { ...set, tiebreakScore: newTb };
    this.state.sets = [newSet];
    this.state.server = newServer;
    this.state.currentGame = this.createEmptyGame();
    return this.getState();
  }

  private completeMatchTiebreak(winner: 'player1' | 'player2', tbScore: { player1: number; player2: number }, newServer: 'player1' | 'player2'): ScoringState {
    const setWinnerGames = winner === 'player1' ? 1 : 0;
    const setLoserGames = winner === 'player1' ? 0 : 1;
    this.state.sets = [{
      player1: setWinnerGames,
      player2: setLoserGames,
      isTiebreak: true,
      tiebreakScore: tbScore,
    }];
    this.state.setsWon = winner === 'player1' ? { player1: 1, player2: 0 } : { player1: 0, player2: 1 };
    this.state.isFinished = true;
    this.state.winner = winner;
    this.state.server = newServer;
    return this.getState();
  }

  private processRegularPoint(winner: 'player1' | 'player2'): ScoringState {
    const game = this.state.currentGame;
    if (game.isDeuce) return this.processDeucePoint(winner);
    return this.processStandardPoint(winner);
  }

  // FIX Bug 3b: rewritten to be unambiguous about each scoring boundary.
  // Previous code had two flaws:
  //   1. After reaching deuce (3–3) it clipped both scores to 3, then fell
  //      through to the ">= 4" checks on the clipped values — those checks
  //      could never fire, but the logic was confusing and broke when
  //      loadState() injected states like { player1:4, player2:3, isDeuce:false }.
  //   2. For NO_AD it called handleGameWon() correctly, but then kept the
  //      ">= 4" guards below that were unreachable — dead code that shadowed
  //      the intent.
  // New approach: strict ordering with early returns so no path can fall
  // through to a wrong branch.
  private processStandardPoint(winner: 'player1' | 'player2'): ScoringState {
    const game = { ...this.state.currentGame };

    if (winner === 'player1') game.player1++;
    else game.player2++;

    // NO_AD: golden point at 3–3 (displayed as 40–40).
    if (this.usesNoAd()) {
      if (game.player1 >= 3 && game.player2 >= 3) {
        // Whoever won this point wins the game immediately.
        game.isDeuce = true;
        game.player1 = 3;
        game.player2 = 3;
        this.state.currentGame = game;
        return this.handleGameWon(winner, game);
      }
      // Normal win before deuce territory.
      const needed = this.config.format === 'SHORT_SET_2V2_NO_AD' ? 4 : 4;
      if (game.player1 >= needed || game.player2 >= needed) {
        const gameWinner = game.player1 >= needed ? 'player1' : 'player2';
        return this.handleGameWon(gameWinner, game);
      }
      return { ...this.state, currentGame: game };
    }

    // Standard AD scoring.
    // Reaching 3–3: enter deuce.
    if (game.player1 === 3 && game.player2 === 3) {
      game.isDeuce = true;
      this.state.currentGame = game;
      return { ...this.state, currentGame: game };
    }

    // One player reaches 4+ before opponent reaches 3 → clean win.
    if (game.player1 >= 4 && game.player2 < 3) {
      return this.handleGameWon('player1', game);
    }
    if (game.player2 >= 4 && game.player1 < 3) {
      return this.handleGameWon('player2', game);
    }

    // Both at 3+ but not equal → impossible after a legal sequence, but guard
    // against states injected via loadState after score edit. Treat as deuce.
    if (game.player1 >= 3 && game.player2 >= 3) {
      game.isDeuce = true;
      game.player1 = 3;
      game.player2 = 3;
      this.state.currentGame = game;
      return { ...this.state, currentGame: game };
    }

    return { ...this.state, currentGame: game };
  }

  private handleGameWon(gameWinner: 'player1' | 'player2', finalGame: GameScore): ScoringState {
    const currentSetIndex = this.state.sets.length === 0 ? 0 : this.state.sets.length - 1;
    let currentSet = this.state.sets[currentSetIndex] ?? this.createEmptySet();

    if (this.isSetComplete(currentSet, this.state.setsWon) && !currentSet.isTiebreak && (currentSet.player1 > 0 || currentSet.player2 > 0)) {
      currentSet = this.createEmptySet();
    }

    const newSet = { ...currentSet };
    if (gameWinner === 'player1') newSet.player1++;
    else if (gameWinner === 'player2') newSet.player2++;
    else {
      console.error('[ScoringEngine] handleGameWon: invalid gameWinner', { gameWinner, currentSet });
      throw new Error('INVALID_GAME_WINNER');
    }

    const newSets = [...this.state.sets];
    if (currentSet.player1 === 0 && currentSet.player2 === 0 && !currentSet.isTiebreak) {
      newSets.push(newSet);
    } else {
      newSets[currentSetIndex] = newSet;
    }

    const newServer = this.state.server === 'player1' ? 'player2' : 'player1';

    // Detectar se deve iniciar Match Tiebreak ao invés de set regular
    const shouldStartMatchTiebreak = this.shouldStartMatchTiebreak();
    if (shouldStartMatchTiebreak) {
      // Inicia match tiebreak como um set único
      const matchTbSet: SetScore = {
        player1: 0,
        player2: 0,
        isTiebreak: true,
        tiebreakScore: { player1: 0, player2: 0 },
      };
      newSets.push(matchTbSet);
      return {
        ...this.state,
        sets: newSets,
        currentGame: this.createEmptyGame(),
        server: newServer,
      };
    }

    if (this.shouldStartTiebreak(newSet)) {
      newSet.isTiebreak = true;
      newSet.tiebreakScore = { player1: 0, player2: 0 };
      const newSetIndex = newSets.length - 1;
      newSets[newSetIndex] = newSet;
      return {
        ...this.state,
        sets: newSets,
        currentGame: this.createEmptyGame(),
        server: newServer,
      };
    }

    // FIX Bug 3c: pass the *current* setsWon (pre-increment) so isSetComplete
    // evaluates the format guard correctly before completeSet increments it.
    if (this.isSetComplete(newSet, this.state.setsWon)) {
      return this.completeSet(gameWinner, newSet, newSets, newServer);
    }

    return {
      ...this.state,
      sets: newSets,
      currentGame: this.createEmptyGame(),
      server: newServer,
    };
  }

  private processDeucePoint(winner: 'player1' | 'player2'): ScoringState {
    const game = { ...this.state.currentGame };

    if (game.advantage === null) {
      game.advantage = winner;
    } else if (game.advantage === winner) {
      return this.handleGameWon(winner, game);
    } else {
      game.advantage = null;
    }

    return { ...this.state, currentGame: game };
  }

  private processTiebreakPoint(winner: 'player1' | 'player2'): ScoringState {
    const currentSetIndex = this.state.sets.length - 1;
    const currentSet = this.state.sets[currentSetIndex];
    const tb = currentSet.tiebreakScore ?? { player1: 0, player2: 0 };
    const newTb = { ...tb };

    if (winner === 'player1') newTb.player1++;
    else newTb.player2++;

    const total = newTb.player1 + newTb.player2;
    const newServer = total % 2 === 0
      ? this.state.server
      : (this.state.server === 'player1' ? 'player2' : 'player1');

    // Match tiebreak (10 pts) vs Set tiebreak (7 pts)
    const isMatchTb = this.config.format === 'MATCH_TB_10' ||
      (this.config.format === 'BEST_OF_5' && this.state.sets.length === 5) ||
      (this.config.format === 'BEST_OF_3_MATCH_TB' && this.state.sets.length === 3) ||
      (this.config.format === 'SHORT_SET_2V2_NO_AD' && this.state.sets.length === 3);
    const tbMin = isMatchTb ? 10 : 7;

    if (newTb.player1 >= tbMin && newTb.player1 - newTb.player2 >= 2) {
      return this.completeSetWithTiebreak('player1', newTb, newServer);
    }
    if (newTb.player2 >= tbMin && newTb.player2 - newTb.player1 >= 2) {
      return this.completeSetWithTiebreak('player2', newTb, newServer);
    }

    const newSet: SetScore = { ...currentSet, tiebreakScore: newTb };
    const newSets = [...this.state.sets];
    newSets[currentSetIndex] = newSet;

    return {
      ...this.state,
      sets: newSets,
      currentGame: this.createEmptyGame(),
      server: newServer,
    };
  }

  private isSetComplete(set: SetScore, setsWon: { player1: number; player2: number }): boolean {
    const diff = Math.abs(set.player1 - set.player2);
    const maxGames = Math.max(set.player1, set.player2);

    // Tiebreak de set regular (7 pts)
    if (set.isTiebreak && set.tiebreakScore) {
      const tb = set.tiebreakScore;
      const tbMax = Math.max(tb.player1, tb.player2);
      const tbDiff = Math.abs(tb.player1 - tb.player2);
      // Match tiebreak (10 pts) vs Set tiebreak (7 pts)
      const isMatchTb = this.config.format === 'MATCH_TB_10' ||
        (this.config.format === 'BEST_OF_5' && this.state.sets.length === 5) ||
        (this.config.format === 'BEST_OF_3_MATCH_TB' && this.state.sets.length === 3) ||
        (this.config.format === 'SHORT_SET_2V2_NO_AD' && this.state.sets.length === 3);
      const tbMin = isMatchTb ? 10 : 7;
      return tbMax >= tbMin && tbDiff >= 2;
    }

    if (this.usesNoAd()) {
      const needed = this.config.format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6;
      return maxGames >= needed && diff >= 2;
    }

    if (this.isFinalSet()) {
      const needed = this.getGamesToTiebreak();
      // PRO_SET_8: completa em 8 games com diff 2, ou TB em 8/8
      if (this.config.format === 'PRO_SET_8') {
        return maxGames >= 8 && diff >= 2;
      }
      return maxGames >= needed && diff >= 2;
    }

    if (this.config.format === 'BEST_OF_5') {
      // 5º set não completa como set regular (tem MT)
      if (this.state.sets.length >= 4 && setsWon.player1 === 2 && setsWon.player2 === 2) {
        return false;
      }
    }

    if (this.config.format === 'BEST_OF_3') {
      // 3º set completa normal (sem TB)
      if (maxGames === 6 && diff >= 2) return true;
      if (maxGames > 6 && diff >= 2) return true;
      return false;
    }

    if (maxGames === 6 && diff >= 2) return true;
    if (maxGames > 6 && diff >= 2) return true;
    return false;
  }

  private shouldStartTiebreak(set: SetScore): boolean {
    const noAd = this.usesNoAd();
    const isFinalSet_ = this.isFinalSet();

    if (noAd) return set.player1 === 4 && set.player2 === 4;
    
    if (isFinalSet_) {
      const games = this.getGamesToTiebreak();
      // PRO_SET_8: TB em 8/8
      return set.player1 === games && set.player2 === games;
    }
    
    // BEST_OF_5: 5º set tem MT em 6/6
    if (this.config.format === 'BEST_OF_5') {
      const setsWon = this.state.setsWon;
      if (this.state.sets.length >= 4 && setsWon.player1 === 2 && setsWon.player2 === 2) {
        return set.player1 === 6 && set.player2 === 6; // MT no 5º set
      }
      return set.player1 === 6 && set.player2 === 6; // TB regular sets 1-4
    }
    
    // BEST_OF_3: 3º set NÃO tem tiebreak
    if (this.config.format === 'BEST_OF_3') {
      const setsWon = this.state.setsWon;
      if (this.state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
        return false;
      }
      return set.player1 === 6 && set.player2 === 6;
    }
    
    if (this.config.format === 'BEST_OF_3_MATCH_TB') {
      const setsWon = this.state.setsWon;
      // 3º set (1-1) NÃO inicia TB regular - será MT
      if (this.state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
        return false;
      }
      return set.player1 === 6 && set.player2 === 6;
    }
    
    return set.player1 === 6 && set.player2 === 6;
  }

  private shouldStartMatchTiebreak(): boolean {
    // BEST_OF_3_MATCH_TB: 3º set (1-1 em sets)
    if (this.config.format === 'BEST_OF_3_MATCH_TB') {
      const setsWon = this.state.setsWon;
      if (setsWon.player1 === 1 && setsWon.player2 === 1 && this.state.sets.length === 2) {
        return true;
      }
    }
    
    // SHORT_SET_2V2_NO_AD: 3º set (1-1 em sets)
    if (this.config.format === 'SHORT_SET_2V2_NO_AD') {
      const setsWon = this.state.setsWon;
      if (setsWon.player1 === 1 && setsWon.player2 === 1 && this.state.sets.length === 2) {
        return true;
      }
    }
    
    // BEST_OF_5: 5º set (2-2 em sets) em 6/6
    if (this.config.format === 'BEST_OF_5') {
      const setsWon = this.state.setsWon;
      if (setsWon.player1 === 2 && setsWon.player2 === 2 && this.state.sets.length === 4) {
        return true;
      }
    }
    
    return false;
  }

  private usesNoAd(): boolean {
    return this.config.format === 'SHORT_SET_2V2_NO_AD';
  }

  private isFinalSet(): boolean {
    return this.config.format === 'PRO_SET_8';
  }

  private getGamesToTiebreak(): number {
    return this.config.format === 'PRO_SET_8' ? 8 : 6;
  }

  // FIX Bug 3c: accept current setsWon as a parameter so the BEST_OF_3_MATCH_TB
  // guard is evaluated against the *pre-increment* value. Previously the method
  // read this.state.setsWon, which is only correct before completeSet increments
  // it — but when called from handleGameWon the guard must decide whether the
  // *current* set is final before incrementing. Passing it explicitly removes
  // the dependency on mutation order.
  private isSetComplete(set: SetScore, setsWon: { player1: number; player2: number }): boolean {
    const diff = Math.abs(set.player1 - set.player2);
    const maxGames = Math.max(set.player1, set.player2);

    // Tiebreak de set regular (7 pts)
    if (set.isTiebreak && set.tiebreakScore) {
      const tb = set.tiebreakScore;
      const tbMax = Math.max(tb.player1, tb.player2);
      const tbDiff = Math.abs(tb.player1 - tb.player2);
      // Match tiebreak (10 pts) vs Set tiebreak (7 pts)
      const isMatchTb = this.config.format === 'MATCH_TB_10' ||
        (this.config.format === 'BEST_OF_5' && this.state.sets.length === 5) ||
        (this.config.format === 'BEST_OF_3_MATCH_TB' && this.state.sets.length === 3) ||
        (this.config.format === 'SHORT_SET_2V2_NO_AD' && this.state.sets.length === 3);
      const tbMin = isMatchTb ? 10 : 7;
      return tbMax >= tbMin && tbDiff >= 2;
    }

    if (this.usesNoAd()) {
      const needed = this.config.format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6;
      return maxGames >= needed && diff >= 2;
    }

    if (this.isFinalSet()) {
      const needed = this.getGamesToTiebreak();
      // PRO_SET_8: completa em 8 games com diff 2, ou TB em 8/8
      if (this.config.format === 'PRO_SET_8') {
        return maxGames >= 8 && diff >= 2;
      }
      return maxGames >= needed && diff >= 2;
    }

    if (this.config.format === 'BEST_OF_5') {
      // 5º set não completa como set regular (tem MT)
      if (this.state.sets.length >= 4 && setsWon.player1 === 2 && setsWon.player2 === 2) {
        return false;
      }
    }

    if (this.config.format === 'BEST_OF_3') {
      // 3º set completa normal (sem TB)
      if (maxGames === 6 && diff >= 2) return true;
      if (maxGames > 6 && diff >= 2) return true;
      return false;
    }

    if (maxGames === 6 && diff >= 2) return true;
    if (maxGames > 6 && diff >= 2) return true;
    return false;
  }

  private completeSet(setWinner: 'player1' | 'player2', finalSet: SetScore, newSets: SetScore[], newServer: 'player1' | 'player2'): ScoringState {
    const setsWon = { ...this.state.setsWon };
    if (setWinner === 'player1') setsWon.player1++;
    else setsWon.player2++;

    const setsToWin = this.getSetsToWin();

    if (this.config.format === 'BEST_OF_3_MATCH_TB') {
      if (setsWon.player1 >= 2) {
        this.state.sets = newSets;
        this.state.setsWon = setsWon;
        this.state.isFinished = true;
        this.state.winner = 'player1';
        this.state.server = newServer;
        return this.getState();
      }
      if (setsWon.player2 >= 2) {
        this.state.sets = newSets;
        this.state.setsWon = setsWon;
        this.state.isFinished = true;
        this.state.winner = 'player2';
        this.state.server = newServer;
        return this.getState();
      }
      if (setsWon.player1 === 1 && setsWon.player2 === 1) {
        // Inicia match tiebreak como 3º set
        const matchTbSet: SetScore = {
          player1: 0,
          player2: 0,
          isTiebreak: true,
          tiebreakScore: { player1: 0, player2: 0 },
        };
        newSets.push(matchTbSet);
        return {
          ...this.state,
          sets: newSets,
          setsWon,
          currentGame: this.createEmptyGame(),
          server: newServer,
        };
      }
    }

    if (setsWon.player1 >= setsToWin) {
      this.state.sets = newSets;
      this.state.setsWon = setsWon;
      this.state.isFinished = true;
      this.state.winner = 'player1';
      this.state.server = newServer;
      return this.getState();
    }
    if (setsWon.player2 >= setsToWin) {
      this.state.sets = newSets;
      this.state.setsWon = setsWon;
      this.state.isFinished = true;
      this.state.winner = 'player2';
      this.state.server = newServer;
      return this.getState();
    }

    return {
      ...this.state,
      sets: newSets,
      setsWon,
      currentGame: this.createEmptyGame(),
      server: newServer,
    };
  }

  private completeSetWithTiebreak(setWinner: 'player1' | 'player2', tbScore: { player1: number; player2: number }, newServer: 'player1' | 'player2'): ScoringState {
    const currentSetIndex = this.state.sets.length - 1;
    const currentSet = this.state.sets[currentSetIndex];
    const newSet: SetScore = {
      ...currentSet,
      player1: setWinner === 'player1' ? currentSet.player1 + 1 : currentSet.player1,
      player2: setWinner === 'player2' ? currentSet.player2 + 1 : currentSet.player2,
      isTiebreak: false,
      tiebreakScore: tbScore,
    };
    const newSets = [...this.state.sets];
    newSets[currentSetIndex] = newSet;
    return this.completeSet(setWinner, newSet, newSets, newServer);
  }

  private createEmptySet(): SetScore {
    return { player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null };
  }

  private createEmptyGame(): GameScore {
    return { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false };
  }

  getState(): Readonly<ScoringState> {
    return JSON.parse(JSON.stringify(this.state));
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
    return this.history;
  }

  restorePointHistory(history: HistoryEntry[]): void {
    this.history = history;
  }

  reconcileWithCanonicalState(canonicalState: ScoringState, canonicalVersion: number): void {
    this.state = JSON.parse(JSON.stringify(canonicalState));
    if (canonicalVersion < this.history.length) {
      this.history = this.history.slice(0, canonicalVersion);
    }
  }

  loadState(newState: ScoringState): void {
    this.state = JSON.parse(JSON.stringify(newState));
    this.history = [];
  }

  clearHistory(): void {
    this.history = [];
  }

  serialize(): string {
    return JSON.stringify({ state: this.state, history: this.history });
  }

  static fromSerialized(config: ScoringEngineConfig, serialized: string): ScoringEngine {
    const parsed = JSON.parse(serialized);
    let state: ScoringState;
    let history: HistoryEntry[] = [];
    if (parsed.state && Array.isArray(parsed.history)) {
      state = parsed.state as ScoringState;
      history = parsed.history as HistoryEntry[];
    } else {
      state = parsed as ScoringState;
    }
    const engine = new ScoringEngine(config, state);
    if (history.length > 0) engine.restorePointHistory(history);
    return engine;
  }

  private getSetsToWin(): number {
    switch (this.config.format) {
      case 'BEST_OF_5': return 3;
      case 'BEST_OF_3':
      case 'BEST_OF_3_MATCH_TB':
      case 'SHORT_SET_2V2_NO_AD':
        return 2;
      case 'MATCH_TB_10':
      case 'PRO_SET_8':
        return 1;
    }
  }
}
