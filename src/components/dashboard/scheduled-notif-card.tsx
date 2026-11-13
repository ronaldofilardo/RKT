'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import type { ScheduledNotificationItem } from '@/hooks/useScheduledNotifications';

export interface ScheduledNotifCardProps {
  notification: ScheduledNotificationItem;
  onDismiss: (id: string) => void;
}

export function ScheduledNotifCard({ notification, onDismiss }: ScheduledNotifCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { id, payload } = notification;
  const [viewing, setViewing] = useState(false);
  const templateId = payload.templateId || payload.matchId;

  const handleAnnotateOrView = async () => {
    if (!templateId || viewing) return;
    setViewing(true);
    try {
      const res = await fetch(`/api/matches/pool/${templateId}/annotate`, { method: 'POST' });
      if (res.status === 201) {
        const json = await res.json();
        router.push(`/match/${(json as { matchId?: string }).matchId}/scoring`);
        return;
      }
      if (res.status === 409) {
        const json = await res.json();
        const matchId = (json as { details?: { matchId?: string } | null })?.details?.matchId;
        if (matchId) {
          router.push(`/match/${matchId}/scoring`);
          return;
        }
      }
      const json = await res.json().catch(() => ({}));
      toast({ type: 'error', message: json.message || 'Não foi possível abrir a partida.' });
    } catch {
      toast({ type: 'error', message: 'Não foi possível abrir a partida.' });
    } finally {
      setViewing(false);
    }
  };

  return (
    <div
      data-testid="scheduled-notif-card"
      className="p-4 rounded-lg border border-telemetry-volt/30 bg-telemetry-card relative space-y-2 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg leading-none" aria-hidden="true">🎾</span>
        <span className="text-xs font-bold uppercase tracking-wider text-telemetry-volt">Partida Criada por Outro Usuário</span>
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-telemetry-text-primary">{payload.player1Name} × {payload.player2Name}</p>
        {payload.scheduledAt && (
          <p className="text-xs text-telemetry-text-muted">
            Agendado para: {new Date(payload.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        )}
        {payload.createdByName && (
          <p className="text-xs text-telemetry-text-muted flex items-center gap-1.5 flex-wrap">
            <span>Criado por: <span className="text-telemetry-text-primary font-medium">{payload.createdByName}</span></span>
            {payload.creatorRole && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-telemetry-volt/15 text-telemetry-volt border border-telemetry-volt/30">
                {payload.creatorRole}
              </span>
            )}
          </p>
        )}
        {payload.tournamentName && (
          <p className="text-xs text-telemetry-text-muted">
            Torneio: <span className="text-telemetry-text-primary font-medium">{payload.tournamentName}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={() => onDismiss(id)} className="px-3 py-1.5 text-xs font-medium rounded text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/5 transition-colors">
          Dispensar
        </button>
        <button type="button" disabled={viewing} onClick={handleAnnotateOrView} className="px-3 py-1.5 text-xs font-semibold rounded bg-telemetry-volt text-black hover:bg-telemetry-volt/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {viewing ? 'Abrindo...' : 'Anotar minha versão'}
        </button>
      </div>
    </div>
  );
}
