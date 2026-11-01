'use client';

import { useState, useCallback } from 'react';
import type { SpectatorFeedStatus } from '@/core/spectate/types';
import { useWakeLock } from './use-wake-lock';

const STORAGE_KEY = 'rkt_wake_lock_enabled';

/**
 * Hook para controle de preferência do usuário de Screen Wake Lock no espectador.
 */
export function useSpectatorWakeLockPreference(status: SpectatorFeedStatus) {
  const [isWanted, setIsWanted] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleWakeLock = useCallback(() => {
    setIsWanted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const isLive = status === 'LIVE' || status === 'CATCH_UP';
  useWakeLock(isLive && isWanted);

  return { isWakeLockWanted: isWanted, toggleWakeLock };
}

