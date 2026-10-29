'use client';

import React from 'react';
import { UserMinusIcon } from './share-spectate.icons';
import type { SpectatorWatcherItem } from './ShareSpectateWatchersList';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name.slice(0, 2) || 'ES').toUpperCase();
}

export function ShareSpectateWatcherRow({
  item,
  onRemove,
}: {
  item: SpectatorWatcherItem;
  onRemove?: (userId: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2 border-t border-telemetry-border/10 first:border-t-0">
      <div className="w-[30px] h-[30px] rounded-full bg-sky-950/70 border border-sky-500/20 text-sky-400 text-xs font-medium flex items-center justify-center flex-none">
        {getInitials(item.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-telemetry-text-primary truncate">{item.name}</div>
        <div className="text-xs text-telemetry-text-muted truncate">
          {item.statusText || 'Acompanhando'}
        </div>
      </div>
      {item.isOnline && (
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          Online
        </span>
      )}
      {item.canRemove !== false && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.userId)}
          aria-label={`Remover ${item.name}`}
          className="text-telemetry-text-muted hover:text-telemetry-error p-1 transition-colors"
        >
          <UserMinusIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

