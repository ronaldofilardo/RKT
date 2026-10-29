'use client';

import { useState, useEffect } from 'react';
import type { SpectatorFeedStatus } from '@/core/spectate';

export function useRelativeUpdateText(
  lastUpdated: Date | null,
  status: SpectatorFeedStatus,
  isClientOffline: boolean
) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const interval = setInterval(() => {
      const diffSec = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
      setElapsed(diffSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (isClientOffline) return 'Você está sem internet';
  if (status === 'NOT_STARTED') return 'Aguardando início dos pontos';
  if (status === 'NO_SIGNAL') return `Sem sinal do anotador há ${elapsed} s`;
  if (status === 'FINISHED') return 'Partida encerrada';
  if (status === 'PAUSED') return 'Anotação pausada';

  return `Atualizado há ${elapsed || 1} s`;
}

