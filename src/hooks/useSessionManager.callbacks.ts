import { logger } from '@/lib/logger';
import type { SetEditData } from '@/components/scoring/editScoreHelpers';
import type { TennisFormat } from '@/core/scoring/types';
import { validateMatchTiebreakComplete } from './useSessionManager.utils';
import { buildNewScoringState } from './useSessionManager.state-builder';
import { finishMatch } from './useSessionManager.match-finish';
import type { SessionManagerContext } from './useSessionManager';
import type { ToastType } from '@/components/Toast';

async function completeFinishedSession(ctx: SessionManagerContext, sid: string, state: unknown) {
  const stateResponse = await fetch(`/api/matches/${ctx.matchId}/state`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.tokenRef.current}` },
    body: JSON.stringify({ state: 'FINISHED', scoreState: state, ...(ctx.match?.version !== undefined ? { version: ctx.match.version } : {}) }),
  });
  if (stateResponse.status === 409) {
    logger.warn('[abandonCurrentSession] Conflito de versão (409) ao finalizar — outro dispositivo já atualizou o placar. Match já FINISHED ou estado divergente; session não fechada.');
    return;
  }
  if (!stateResponse.ok) throw new Error(`state PATCH failed: ${stateResponse.status}`);
  try {
    const response = await fetch(`/api/matches/${ctx.matchId}/sessions/${sid}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.tokenRef.current}` },
      body: JSON.stringify({ status: 'COMPLETED', finalState: state }),
    });
    if (!response.ok) logger.warn(`[abandonCurrentSession] session PATCH failed (${response.status}); match already FINISHED — leaving session open`);
  } catch (error) {
    logger.warn('[abandonCurrentSession] session PATCH exception; match already FINISHED — leaving session open', error);
  }
}

async function abandonOpenSession(ctx: SessionManagerContext, sid: string, snapshot: string) {
  await fetch(`/api/matches/${ctx.matchId}/sessions/${sid}/abandon`, {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ctx.tokenRef.current}` },
    body: JSON.stringify({ matchStateSnapshot: snapshot }),
  });
}

export function createAbandonCurrentSession(ctx: SessionManagerContext) {
  return async (snapshot?: string) => {
    const sid = ctx.sessionIdRef.current;
    if (!sid || !ctx.matchId || !ctx.engineRef.current) return;
    const state = ctx.engineRef.current.getState();
    const stateSnapshot = snapshot ?? ctx.engineRef.current.serialize();
    try {
      if (state.isFinished) await completeFinishedSession(ctx, sid, state);
      else await abandonOpenSession(ctx, sid, stateSnapshot);
    } catch (error) { logger.error('[abandonCurrentSession] Error:', error); }
  };
}

export function createHandleEditScore(
  ctx: SessionManagerContext,
  abandonCurrentSession: (snapshot?: string) => Promise<void>,
  toast?: (opts: { type: ToastType; message: string }) => void,
) {
  return async (setResults: SetEditData[], server: 'player1' | 'player2', onMatchFinished?: (winner: 'player1' | 'player2') => void) => {
    const partialSet = setResults.find((set) => set.isPartial);
    const tbValidation = validateMatchTiebreakComplete(setResults, ctx.match?.format || '');
    if (!tbValidation.valid) { toast?.({ type: 'error', message: tbValidation.error ?? 'Validação de tiebreak falhou' }); return; }
    const newState = buildNewScoringState({ setResults, server, format: (ctx.match?.format as TennisFormat) || 'BEST_OF_3', partialSet });
    logger.log('[handleEditScore] newState.currentGame:', newState.currentGame);
    logger.log('[handleEditScore] partialSet:', partialSet);
    if (ctx.suspendedSession) {
      const bankSetsWon = ctx.suspendedSession.bankScoreState?.setsWon ?? { player1: 0, player2: 0 };
      if (newState.setsWon.player1 < bankSetsWon.player1 || newState.setsWon.player2 < bankSetsWon.player2) { toast?.({ type: 'error', message: 'Cannot reduce the number of sets already won.' }); return; }
    }
    const isFinished = newState.isFinished;
    const winner = newState.winner;
    if (ctx.engineRef.current) {
      ctx.engineRef.current.loadState(newState);
      ctx.setScoreState(newState);
      logger.log('[handleEditScore] Engine loaded with state:', JSON.stringify(newState, null, 2));
      logger.log('[handleEditScore] setScoreState called - currentGame:', newState.currentGame);
      logger.log('[handleEditScore] setScoreState called - sets:', JSON.stringify(newState.sets));
      logger.log('[handleEditScore] isMatchTiebreak check:', { format: ctx.match?.format, setResultsLength: setResults.length, firstSet: setResults[0], lastSet: setResults[setResults.length - 1], hasCompletedSetsBefore: setResults.slice(0, -1).some((s) => !s.isPartial) });
    }
    ctx.setPendingEditScore(null);
    ctx.clearPendingEdit?.();
    ctx.setSuspendedSession(null);
    if (isFinished && winner) {
      logger.log('[handleEditScore] Match finished - will persist via /finish endpoint');
    } else {
      logger.log('[handleEditScore] Calling persistState with currentGame:', newState.currentGame);
      const result = await ctx.persistState(newState, 'edit-score', { isManualScoreEdit: true });
      if (result.success) logger.log('[handleEditScore] State persisted successfully');
      else if (result.needsResync) { logger.warn('[handleEditScore] Needs resync due to version conflict'); await ctx.fetchMatch(true); (ctx.closeAll ?? ctx.close)(); return; }
      else logger.error('[handleEditScore] Failed to persist state');
    }
    if (isFinished && winner) {
      const winnerPlayerId = winner === 'player1' ? ctx.match?.player1.id : ctx.match?.player2.id;
      if (winnerPlayerId && ctx.matchId) {
        const result = await finishMatch({ matchId: ctx.matchId, tokenRef: ctx.tokenRef, matchVersion: ctx.match?.version }, winnerPlayerId, newState);
        if (result.error === 'offline') toast?.({ type: 'info', message: 'Partida finalizada offline. Sincronização pendente.' });
        else if (!result.success && result.error) toast?.({ type: 'error', message: `${result.error}\n\nA partida foi encerrada localmente, mas não foi possível sincronizar com o servidor.` });
      }
      if (onMatchFinished) onMatchFinished(winner);
    }
    await abandonCurrentSession();
    ctx.setSessionActive(false);
    (ctx.closeAll ?? ctx.close)();
  };
}
