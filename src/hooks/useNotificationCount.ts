import { useState, useEffect, useCallback } from 'react';

export interface NotificationCounts {
  poolWithAthlete: number;
  poolAvailable: number;
  assigned: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotificationCount(): NotificationCounts {
  const [poolWithAthlete, setPoolWithAthlete] = useState(0);
  const [poolAvailable, setPoolAvailable] = useState(0);
  const [assigned, setAssigned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count');
      if (res.ok) {
        const data = await res.json();
        setPoolWithAthlete(data.pool_with_athlete ?? 0);
        setPoolAvailable(data.pool_available ?? 0);
        setAssigned(data.assigned ?? 0);
      }
    } catch {
      // Falha de rede silenciosa
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  return {
    poolWithAthlete,
    poolAvailable,
    assigned,
    isLoading,
    refresh: fetchCounts,
  };
}

