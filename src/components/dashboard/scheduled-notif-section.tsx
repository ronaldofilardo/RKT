'use client';

import { useMemo } from 'react';
import { useScheduledNotifications } from '@/hooks/useScheduledNotifications';
import { ScheduledNotifCard } from './scheduled-notif-card';

export function ScheduledNotifSection() {
  const { notifications, isLoading, markAsRead } = useScheduledNotifications();

  const uniqueNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    const seen = new Set<string>();
    return notifications.filter((notif) => {
      const p = notif.payload || {};
      const p1 = (p.player1Name || '').trim().toLowerCase();
      const p2 = (p.player2Name || '').trim().toLowerCase();
      const pair = [p1, p2].sort().join('::');
      const sched = p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : '';
      const key = pair && sched ? `${pair}::${sched}` : (p.templateId || p.matchId || notif.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border border-white/5 bg-telemetry-elevated/20 animate-pulse h-24" />
    );
  }

  if (uniqueNotifications.length === 0) {
    return null;
  }

  return (
    <section aria-label="Partidas Criadas por Outros Usuários" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-telemetry-text-muted uppercase tracking-wider">
          Partidas Criadas por Outros Usuários ({uniqueNotifications.length})
        </h3>
      </div>
      <div className="space-y-2.5">
        {uniqueNotifications.map((notif) => (
          <ScheduledNotifCard
            key={notif.id}
            notification={notif}
            onDismiss={markAsRead}
          />
        ))}
      </div>
    </section>
  );
}
