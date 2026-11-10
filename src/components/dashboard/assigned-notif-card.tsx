'use client';

import { useRouter } from 'next/navigation';
import type { AssignedNotificationItem } from '@/hooks/useAssignedNotifications';

export interface AssignedNotifCardProps {
  notification: AssignedNotificationItem;
  onDismiss: (id: string) => void;
}

export function AssignedNotifCard({ notification, onDismiss }: AssignedNotifCardProps) {
  const router = useRouter();
  const { id, payload } = notification;

  const handleView = () => {
    onDismiss(id);
    router.push(`/partidas-publicas?templateId=${payload.templateId || payload.matchId}`);
  };

  return (
    <div
      data-testid="assigned-notif-card"
      className="p-4 rounded-lg border border-telemetry-blue/40 bg-telemetry-card relative space-y-2 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none" aria-hidden="true">🎾</span>
        <span className="text-xs font-bold uppercase tracking-wider text-telemetry-blue-light">
          Você foi designado para anotar
        </span>
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-telemetry-text-primary">
          {payload.player1Name} × {payload.player2Name}
        </p>
        {payload.scheduledAt && (
          <p className="text-xs text-telemetry-text-muted">
            Agendado para: {new Date(payload.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}
        <p className="text-xs text-telemetry-text-muted">
          Atribuído por: <span className="text-telemetry-text-primary font-medium">{payload.assignedByName}</span>
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="px-3 py-1.5 text-xs font-medium rounded text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/5 transition-colors"
        >
          Dispensar
        </button>
        <button
          type="button"
          onClick={handleView}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-telemetry-blue hover:bg-telemetry-blue/80 text-white shadow-sm transition-colors"
        >
          Ver Partida
        </button>
      </div>
    </div>
  );
}

