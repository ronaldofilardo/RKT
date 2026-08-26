'use client';

import { useCallback } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { clearAuthState } from '@/lib/auth-client';
import { logger } from '@/lib/logger';
import type { Match } from './dashboard.types';

type DashboardMatch = Match & { suspendedSessionId?: string; matchStateSnapshot?: string | null };

type ActionsOptions = {
  router: AppRouterInstance;
  handleResumeSuspended: (match: DashboardMatch) => void;
  setMatchToDelete: (match: DashboardMatch | null) => void;
  setMatchToFinish: (match: DashboardMatch | null) => void;
};

export function useDashboardPageActions({ router, handleResumeSuspended, setMatchToDelete, setMatchToFinish }: ActionsOptions) {
  const handleMatchClick = useCallback((match: DashboardMatch) => {
    if (match.state === 'FINISHED') router.push(`/match/${match.id}/report`);
    else if (match.suspendedSessionId || match.matchStateSnapshot) handleResumeSuspended(match);
    else router.push(`/match/${match.id}/scoring?modal=edit-score`);
  }, [router, handleResumeSuspended]);

  const handleMatchReport = useCallback((match: DashboardMatch) => router.push(`/match/${match.id}/report`), [router]);
  const handleMatchFinish = useCallback((match: DashboardMatch) => setMatchToFinish(match), [setMatchToFinish]);
  const handleMatchDelete = useCallback((match: DashboardMatch) => setMatchToDelete(match), [setMatchToDelete]);

  const handleLogout = useCallback(() => {
    if (!window.confirm('Deseja realmente sair?')) return;
    try { clearAuthState(); } catch (error) { logger.error('[logout] Erro ao limpar auth state', error); }
    router.replace('/login');
  }, [router]);

  return { handleMatchClick, handleMatchReport, handleMatchFinish, handleMatchDelete, handleLogout };
}
