'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SessionContextOption } from '@/lib/auth-client-login';

export function useAtletasContext() {
  const [activeContextId, setActiveContextId] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [availableContexts, setAvailableContexts] = useState<SessionContextOption[]>([]);
  const [ctName, setCtName] = useState<string | null>(null);

  const isParticular = activeContextId === 'PARTICULAR' || activeArea === 'TREINADOR_AVULSO';

  const loadContext = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        const ctxId = data.activeContextId ?? null;
        const area = data.activeArea ?? null;
        setActiveContextId(ctxId);
        setActiveArea(area);
        setAvailableContexts(data.availableContexts ?? []);
        const particular = ctxId === 'PARTICULAR' || area === 'TREINADOR_AVULSO';
        if (!particular && ctxId) {
          const currentCtx = (data.availableContexts as any[])?.find((c: any) => c.id === ctxId);
          setCtName(currentCtx?.label?.split(' (')[0] || null);
        } else {
          setCtName(null);
        }
      }
    } catch {
      // fallback silencioso
    }
  }, []);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  return {
    activeContextId,
    activeArea,
    availableContexts,
    ctName,
    isParticular,
    loadContext,
  };
}

