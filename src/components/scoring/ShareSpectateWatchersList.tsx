'use client';

import React from 'react';
import { UserPlusIcon } from './share-spectate.icons';
import { ShareSpectateWatcherRow } from './ShareSpectateWatcherRow';

export interface SpectatorWatcherItem {
  id: string;
  userId: string;
  name: string;
  statusText?: string;
  isOnline?: boolean;
  canRemove?: boolean;
}

interface Props {
  spectators: SpectatorWatcherItem[];
  maxSpectators?: number;
  onRemoveSpectator?: (userId: string) => void;
  onRevokeLink?: () => void;
  onCopyLink?: () => void;
  revoking?: boolean;
}

export function ShareSpectateWatchersList({
  spectators,
  maxSpectators = 5,
  onRemoveSpectator,
  onRevokeLink,
  onCopyLink,
  revoking,
}: Props) {
  if (spectators.length === 0) {
    return (
      <div className="flex flex-col gap-2.5 mt-1">
        <div className="text-[13px] font-medium text-telemetry-text-primary">
          Acompanhando · 0 de {maxSpectators}
        </div>
        <div className="flex flex-col items-center justify-center text-center py-5 px-3 gap-1.5 border border-telemetry-border/10 rounded-xl bg-telemetry-base/40">
          <UserPlusIcon className="w-6 h-6 text-telemetry-text-muted mb-0.5" />
          <b className="text-sm font-medium text-telemetry-text-primary">Ninguém acompanha ainda</b>
          <p className="text-xs text-telemetry-text-muted m-0">Envie o link para quem quiser ver a partida.</p>
        </div>
        {onCopyLink && (
          <button
            type="button"
            onClick={onCopyLink}
            className="w-full py-2 bg-telemetry-elevated border border-telemetry-border/20 text-telemetry-text-primary text-xs font-medium rounded-lg hover:bg-telemetry-elevated/80 transition-colors"
          >
            Copiar link
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="text-[13px] font-medium text-telemetry-text-primary">
        Acompanhando · {spectators.length} de {maxSpectators}
      </div>

      <div className="flex flex-col">
        {spectators.map((s) => (
          <ShareSpectateWatcherRow key={s.id} item={s} onRemove={onRemoveSpectator} />
        ))}
      </div>

      {onRevokeLink && (
        <button
          type="button"
          onClick={onRevokeLink}
          disabled={revoking}
          className="mt-2 w-full py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {revoking ? 'Revogando...' : 'Revogar convite'}
        </button>
      )}
    </div>
  );
}

