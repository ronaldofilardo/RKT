import { useState, useEffect, useCallback } from 'react';

export interface ScheduledNotificationItem {
  id: string;
  payload: {
    matchId: string;
    templateId: string;
    player1Name: string;
    player2Name: string;
    createdByName?: string;
    creatorRole?: string;
    scheduledAt?: string;
    tournamentName?: string;
  };
  createdAt: string | Date;
}

export function useScheduledNotifications() {
  const [notifications, setNotifications] = useState<ScheduledNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScheduled = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/scheduled');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {
      // Falha de rede silenciosa
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Ignora erro de rede em background
    }
  }, []);

  return { notifications, isLoading, markAsRead, refresh: fetchScheduled };
}

