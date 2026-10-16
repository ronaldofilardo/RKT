'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { AppRouteInput } from '@/lib/app-router';
import type { ResumableMatch } from './dashboard.resume';
import type { DeletableMatch, FinishableMatch } from './dashboard.types';
import { useDashboardServerStart } from './use-dashboard-server-start';

type AppRouter = ReturnType<typeof useRouter>;
type Resume = (match: ResumableMatch, options?: { openEditModal?: boolean }) => void;

interface UseDashboardMatchActionsArgs {
  router: AppRouter;
  resumeSuspendedMatch: Resume;
  setMatchToDelete: Dispatch<SetStateAction<DeletableMatch | null>>;
  setMatchToFinish: Dispatch<SetStateAction<FinishableMatch | null>>;
}

/**
 * Callbacks de match do dashboard (clique, retomar, editar placar/infos,
 * relatório, finalizar, excluir) + modal de edição de informações, compondo
 * a seleção de sacador inicial (useDashboardServerStart).
 */
export function useDashboardMatchActions({
  router,
  resumeSuspendedMatch,
  setMatchToDelete,
  setMatchToFinish,
}: UseDashboardMatchActionsArgs) {
  const serverStart = useDashboardServerStart(router);
  const { setSelectedMatchForServer } = serverStart;
  const [matchToEditInfo, setMatchToEditInfo] = useState<DashboardMatchPayload | null>(null);

  const openMatchDetails = useCallback((match: ResumableMatch) => {
    logger.info('[DashboardPage] match click', match.id, match.state);
    if (match.state === 'FINISHED') {
      router.push(`/match/${match.id}/report` as AppRouteInput);
    } else if (match.suspendedSessionId || match.matchStateSnapshot) {
      resumeSuspendedMatch(match, { openEditModal: false });
    } else if (match.state === 'SCHEDULED' || !match.initialServerId) {
      setSelectedMatchForServer(match);
    } else {
      router.push(`/match/${match.id}/scoring` as AppRouteInput);
    }
  }, [router, resumeSuspendedMatch, setSelectedMatchForServer]);

  const resumeMatch = useCallback((match: ResumableMatch) => {
    logger.info('[DashboardPage] resume match directly', match.id);
    if (match.suspendedSessionId || match.matchStateSnapshot) {
      resumeSuspendedMatch(match, { openEditModal: false });
    } else {
      router.push(`/match/${match.id}/scoring` as AppRouteInput);
    }
  }, [router, resumeSuspendedMatch]);

  const openMatchEditScore = useCallback((match: ResumableMatch) => {
    logger.info('[DashboardPage] edit score match', match.id);
    if (match.suspendedSessionId || match.matchStateSnapshot) {
      resumeSuspendedMatch(match, { openEditModal: true });
    } else {
      router.push(`/match/${match.id}/scoring?modal=edit-score` as AppRouteInput);
    }
  }, [router, resumeSuspendedMatch]);

  const openMatchReport = useCallback((match: DashboardMatchPayload) => {
    router.push(`/match/${match.id}/report` as AppRouteInput);
  }, [router]);

  const finishMatch = useCallback((match: FinishableMatch) => {
    setMatchToFinish(match);
  }, [setMatchToFinish]);

  const openMatchEditInfo = useCallback((match: DashboardMatchPayload) => {
    logger.info('[DashboardPage] edit match info', match.id);
    setMatchToEditInfo(match);
  }, []);

  const deleteMatch = useCallback((match: DeletableMatch) => {
    setMatchToDelete(match);
  }, [setMatchToDelete]);

  return {
    ...serverStart,
    matchToEditInfo,
    setMatchToEditInfo,
    openMatchDetails,
    resumeMatch,
    openMatchEditScore,
    openMatchReport,
    finishMatch,
    openMatchEditInfo,
    deleteMatch,
  };
}
