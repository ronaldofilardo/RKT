'use client';

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/Toast';
import { matchesClient } from '@/services/matchesClient';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { AppRouteInput } from '@/lib/app-router';
import type { ResumableMatch } from './dashboard.resume';
import type { DeletableMatch, FinishableMatch } from './dashboard.types';

type AppRouter = ReturnType<typeof useRouter>;
type Resume = (match: ResumableMatch, options?: { openEditModal?: boolean }) => void;

interface UseDashboardMatchActionsArgs {
  router: AppRouter;
  handleResumeSuspended: Resume;
  setMatchToDelete: Dispatch<SetStateAction<DeletableMatch | null>>;
  setMatchToFinish: Dispatch<SetStateAction<FinishableMatch | null>>;
}

/**
 * Callbacks de match do dashboard (clique, retomar, editar placar/infos,
 * relatório, finalizar, excluir) + o estado de seleção de sacador e do modal
 * de edição de informações.
 */
export function useDashboardMatchActions({
  router,
  handleResumeSuspended,
  setMatchToDelete,
  setMatchToFinish,
}: UseDashboardMatchActionsArgs) {
  const { toast } = useToast();
  const [selectedMatchForServer, setSelectedMatchForServer] = useState<DashboardMatchPayload | null>(null);
  const [startingMatch, setStartingMatch] = useState(false);
  const [matchToEditInfo, setMatchToEditInfo] = useState<DashboardMatchPayload | null>(null);

  const handleMatchClick = useCallback((match: ResumableMatch) => {
    logger.info('[DashboardPage] match click', match.id, match.state);
    if (match.state === 'FINISHED') {
      router.push(`/match/${match.id}/report` as AppRouteInput);
    } else if (match.suspendedSessionId || match.matchStateSnapshot) {
      handleResumeSuspended(match, { openEditModal: false });
    } else if (match.state === 'SCHEDULED' || !match.initialServerId) {
      setSelectedMatchForServer(match);
    } else {
      router.push(`/match/${match.id}/scoring` as AppRouteInput);
    }
  }, [router, handleResumeSuspended]);

  const handleMatchResume = useCallback((match: ResumableMatch) => {
    logger.info('[DashboardPage] resume match directly', match.id);
    if (match.suspendedSessionId || match.matchStateSnapshot) {
      handleResumeSuspended(match, { openEditModal: false });
    } else {
      router.push(`/match/${match.id}/scoring` as AppRouteInput);
    }
  }, [router, handleResumeSuspended]);

  const handleMatchEditScore = useCallback((match: ResumableMatch) => {
    logger.info('[DashboardPage] edit score match', match.id);
    if (match.suspendedSessionId || match.matchStateSnapshot) {
      handleResumeSuspended(match, { openEditModal: true });
    } else {
      router.push(`/match/${match.id}/scoring?modal=edit-score` as AppRouteInput);
    }
  }, [router, handleResumeSuspended]);

  const handleSelectServer = async (serverId: string) => {
    if (!selectedMatchForServer) return;
    setStartingMatch(true);
    try {
      await matchesClient.startMatch(selectedMatchForServer.id, {
        state: 'IN_PROGRESS',
        initialServerId: serverId,
      });
      router.push(`/match/${selectedMatchForServer.id}/scoring` as AppRouteInput);
    } catch (err) {
      logger.error('[DashboardPage handleSelectServer]', err);
      toast({ type: 'error', message: 'Erro ao iniciar partida' });
      setStartingMatch(false);
    }
  };

  const handleMatchReport = useCallback((match: DashboardMatchPayload) => {
    router.push(`/match/${match.id}/report` as AppRouteInput);
  }, [router]);

  const handleMatchFinish = useCallback((match: FinishableMatch) => {
    setMatchToFinish(match);
  }, [setMatchToFinish]);

  const handleMatchEditInfo = useCallback((match: DashboardMatchPayload) => {
    logger.info('[DashboardPage] edit match info', match.id);
    setMatchToEditInfo(match);
  }, []);

  const handleMatchDelete = useCallback((match: DeletableMatch) => {
    setMatchToDelete(match);
  }, [setMatchToDelete]);

  return {
    selectedMatchForServer,
    setSelectedMatchForServer,
    startingMatch,
    matchToEditInfo,
    setMatchToEditInfo,
    handleMatchClick,
    handleMatchResume,
    handleMatchEditScore,
    handleSelectServer,
    handleMatchReport,
    handleMatchFinish,
    handleMatchEditInfo,
    handleMatchDelete,
  };
}
