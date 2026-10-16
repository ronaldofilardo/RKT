'use client';

import { useState, useCallback } from 'react';
import type { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { useToast } from '@/components/Toast';
import { matchesClient } from '@/services/matchesClient';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { AppRouteInput } from '@/lib/app-router';

/**
 * Seleção de sacador inicial para partidas sem servidor definido (ou agendadas)
 * e partida em andamento do modal correspondente.
 */
export function useDashboardServerStart(router: ReturnType<typeof useRouter>) {
  const { toast } = useToast();
  const [selectedMatchForServer, setSelectedMatchForServer] = useState<DashboardMatchPayload | null>(null);
  const [startingMatch, setStartingMatch] = useState(false);

  const selectServingPlayer = useCallback(async (serverId: string) => {
    if (!selectedMatchForServer) return;
    setStartingMatch(true);
    try {
      await matchesClient.startMatch(selectedMatchForServer.id, {
        state: 'IN_PROGRESS',
        initialServerId: serverId,
      });
      router.push(`/match/${selectedMatchForServer.id}/scoring` as AppRouteInput);
    } catch (err) {
      logger.error('[DashboardPage selectServingPlayer]', err);
      toast({ type: 'error', message: 'Erro ao iniciar partida' });
      setStartingMatch(false);
    }
  }, [router, selectedMatchForServer, toast]);

  return {
    selectedMatchForServer,
    setSelectedMatchForServer,
    startingMatch,
    selectServingPlayer,
  };
}
