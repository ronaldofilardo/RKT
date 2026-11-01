'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para manter a tela do celular ligada durante a transmissão ao vivo
 * via Screen Wake Lock API (com fallback silencioso caso não suportado).
 */
export function useWakeLock(enabled: boolean): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.wakeLock) {
      return;
    }

    let isMounted = true;

    async function requestLock() {
      try {
        if (document.visibilityState === 'visible' && !sentinelRef.current) {
          const sentinel = await navigator.wakeLock.request('screen');
          if (isMounted) {
            sentinelRef.current = sentinel;
            sentinel.addEventListener('release', () => {
              sentinelRef.current = null;
            });
          } else {
            await sentinel.release();
          }
        }
      } catch {
        // Ignora erros de permissão ou economia de bateria do sistema operacional
        sentinelRef.current = null;
      }
    }

    void requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [enabled]);
}

