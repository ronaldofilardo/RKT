'use client';

import { useAssignedNotifications } from '@/hooks/useAssignedNotifications';
import { AssignedNotifCard } from './assigned-notif-card';

export function AssignedNotifSection() {
  const { notifications, isLoading, markAsRead } = useAssignedNotifications();

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border border-white/5 bg-telemetry-elevated/20 animate-pulse h-24" />
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <section aria-label="Mural de Avisos do Treinador" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-telemetry-text-muted uppercase tracking-wider">
          Avisos de Designação ({notifications.length})
        </h3>
      </div>
      <div className="space-y-2.5">
        {notifications.map((notif) => (
          <AssignedNotifCard
            key={notif.id}
            notification={notif}
            onDismiss={markAsRead}
          />
        ))}
      </div>
    </section>
  );
}

