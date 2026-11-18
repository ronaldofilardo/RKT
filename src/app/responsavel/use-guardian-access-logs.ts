'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AccessLogsData {
  account: {
    hasAccount: boolean;
    email: string | null;
    mustChangePassword: boolean;
    createdAt: string | null;
  };
  logs: Array<{
    id: string;
    action: string;
    createdAt: string;
    userAgent: string;
  }>;
}

export function useGuardianAccessLogs(playerId?: string) {
  const [data, setData] = useState<AccessLogsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!playerId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/guardians/me/dependents/${playerId}/access-logs`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return { data, loading, refetch: fetchLogs };
}
