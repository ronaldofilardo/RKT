import { useState, useEffect, useCallback } from 'react';

export interface AssignedNotificationItem {
  id: string;
  payload: {
    matchId: string;
    templateId: string;
    player1Name: string;
    player2Name: string;
    assignedByName: string;
    scheduledAt?: string;
  };
  createdAt: string | Date;
}

export function useAssignedNotifications() {
  const [notifications, setNotifications] = useState<AssignedNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssigned = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/assigned');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data ?? []);
      }
    } catch {
      // Falha de rede silenciosa
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Ignora erro de rede em background
    }
  }, []);

  return { notifications, isLoading, markAsRead, refresh: fetchAssigned };
}

