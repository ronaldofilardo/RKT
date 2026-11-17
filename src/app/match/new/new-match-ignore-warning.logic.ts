import { logger } from '@/lib/logger';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { NewMatchState } from './useNewMatchState';
import { createMatchRequest } from './new-match-submit.logic';
import { isMatchScheduledForFuture } from './schedule-check.logic';

type ToastFn = (t: { type: 'success' | 'error' | 'info'; message: string }) => void;
type RouterLike = { push: (url: string) => void } | AppRouterInstance;

export function notifyMatchCreated(isScheduled: boolean, toast: ToastFn): void {
  if (isScheduled) {
    toast({ type: 'success', message: 'Partida agendada com sucesso!' });
  } else {
    toast({ type: 'success', message: 'Partida criada com sucesso!' });
  }
}

/** Cartaz não vira partida anotada: orienta o criador a encontrá-lo no Histórico. */
export function notifyTemplateCreated(toast: ToastFn): void {
  toast({
    type: 'success',
    message: 'Cartaz publicado! Ele já aparece em Minhas Partidas — use "Anotar minha versão" para registrar a sua versão.',
  });
}

export function resolvePostMatchRedirect(
  toAreaPath?: ((path: string) => string) | null,
  isTemplate = false,
): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const isFromGestor =
      params.get('from') === 'gestor' ||
      sessionStorage.getItem('user_role') === 'GESTOR' ||
      document.cookie.includes('user_role=GESTOR');

    if (isFromGestor) {
      return '/gestor?tab=matches';
    }
  }

  if (isTemplate) {
    return toAreaPath ? toAreaPath('/historico') : '/historico';
  }

  return toAreaPath ? toAreaPath('/dashboard') : '/dashboard';
}

export async function createMatchIgnoringWarning(
  state: NewMatchState,
  router: RouterLike,
  toast: ToastFn,
): Promise<void> {
  if (!state.pendingPayload || state.submittingRef.current) return;
  state.submittingRef.current = true;
  state.setShowDuplicateModal(false);
  state.setLoading(true);
  state.setError(null);
  try {
    const { response, data: match } = await createMatchRequest(state.pendingPayload, true);
    if (!response.ok) throw new Error(match.message || 'Erro ao criar partida');
    if (state.pendingPayload.isTemplate === true) {
      notifyTemplateCreated(toast);
      router.push(resolvePostMatchRedirect(null, true));
      return;
    }
    const isScheduled = isMatchScheduledForFuture(state.date, state.time);
    notifyMatchCreated(isScheduled, toast);
    router.push(resolvePostMatchRedirect(null, false));
  } catch (err) {
    logger.error('[createMatchIgnoringWarning] Error:', err);
    state.setError('Erro ao criar partida');
    toast({ type: 'error', message: 'Erro ao criar partida' });
  } finally {
    state.setLoading(false);
    state.submittingRef.current = false;
  }
}
