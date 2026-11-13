'use client';

import { useScheduledNotifications } from '@/hooks/useScheduledNotifications';
import { ScheduledNotifCard } from './scheduled-notif-card';

export function ScheduledNotifSection() {
  const { notifications, isLoading, markAsRead } = useScheduledNotifications();

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border border-white/5 bg-telemetry-elevated/20 animate-pulse h-24" />
    );
  }

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return null;
  }

  return (
    <section aria-label="Partidas Criadas por Outros Usuários" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-telemetry-text-muted uppercase tracking-wider">
          Partidas Criadas por Outros Usuários ({notifications.length})
        </h3>
      </div>
      <div className="space-y-2.5">
        {notifications.map((notif) => (
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
