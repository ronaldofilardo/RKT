'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useSession } from '@/contexts/SessionContext';
import { logger } from '@/lib/logger';
import { ensureAuthCookie, clearRedirectingFlag } from '@/lib/auth-client';
import {
  useDashboardData,
  useDashboardMatchFilters,
  useDashboardNavigation,
  useModalState,
  useUserAuth,
} from './dashboard.hooks';
import { useResumeSession } from './dashboard.resume';
import { useDeleteMatch, useFinishMatch } from './dashboard.actions';
import { resolveDashboardView } from './dashboard-view.logic';

/**
 * Liga os hooks centrais do dashboard: sessão/auth, navegação, dados,
 * estado de modais, retomada de partida, exclusão/finalização e filtros.
 */
export function useDashboardPageModel() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setSession, setPendingEdit } = useSession();

  logger.info('[DashboardPage] mount pathname=', pathname, 'menuOpen=', false);

  useEffect(() => {
    logger.info('[DashboardPage] pathname changed to', pathname);
    clearRedirectingFlag();
    ensureAuthCookie();
  }, [pathname]);

  const { user } = useUserAuth(router);
  const { navigateToTarget } = useDashboardNavigation(router);
  const { matches, suspendedFromApi, loading, fetchDashboardData } = useDashboardData(router);
  const { matchToDelete, setMatchToDelete, matchToFinish, setMatchToFinish } = useModalState();

  const { resumeSuspendedMatch } = useResumeSession({
    router,
    setSession,
    setPendingEdit,
  });

  const { confirmDeleteMatch } = useDeleteMatch({
    matchToDelete,
    fetchDashboardData,
    toast,
  });

  const { confirmFinishMatch } = useFinishMatch({
    matchToFinish,
    setMatchToFinish,
    fetchDashboardData,
    toast,
  });

  const filters = useDashboardMatchFilters(matches, suspendedFromApi);

  return {
    router,
    user,
    navigateToTarget,
    suspendedFromApi,
    loading,
    fetchDashboardData,
    matchToDelete,
    setMatchToDelete,
    matchToFinish,
    setMatchToFinish,
    resumeSuspendedMatch,
    confirmDeleteMatch,
    confirmFinishMatch,
    view: resolveDashboardView(pathname),
    filters,
  };
}
