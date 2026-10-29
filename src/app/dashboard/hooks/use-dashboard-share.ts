'use client';

import { useState, useCallback } from 'react';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';

export function useDashboardShare() {
  const [matchToShare, setMatchToShare] = useState<DashboardMatchPayload | null>(null);

  const openShareModal = useCallback((match: DashboardMatchPayload) => {
    setMatchToShare(match);
  }, []);

  const closeShareModal = useCallback(() => {
    setMatchToShare(null);
  }, []);

  return {
    matchToShare,
    openShareModal,
    closeShareModal,
  };
}

