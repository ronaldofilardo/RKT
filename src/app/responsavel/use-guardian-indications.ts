'use client';

import { useState, useEffect, useCallback } from 'react';

export interface IndicationsData {
  trainingCenters: Array<{
    id: string;
    ctId: string;
    name: string;
    status: string;
    since: string;
    endedAt: string | null;
  }>;
  coaches: Array<{
    id: string;
    coachUserId: string;
    name: string;
    status: string;
    requestedAt: string;
    respondedAt: string | null;
  }>;
  invites: Array<{
    id: string;
    coachName: string | null;
    coachPhone: string | null;
    expiresAt: string;
    usedAt: string | null;
    createdAt: string;
  }>;
}

export function useGuardianIndications(playerId?: string) {
  const [data, setData] = useState<IndicationsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIndications = useCallback(async () => {
    if (!playerId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/guardians/me/dependents/${playerId}/indications`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    void fetchIndications();
  }, [fetchIndications]);

  return { data, loading, refetch: fetchIndications };
}
