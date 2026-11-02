'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AreaOption, AreaCode } from '@/core/access/areas';
import { purgeOfflineCaches } from '@/lib/offline-storage-purge';

export function useAreaSelection() {
  const router = useRouter();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const available: AreaOption[] = data.availableAreas || [];
        setAreas(available);
        if (available.length === 1) {
          router.replace(available[0].home as any);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [router]);

  const selectArea = async (area: AreaCode, ctId?: string | null, home?: string) => {
    const key = `${area}:${ctId ?? 'default'}`;
    setSwitching(key);
    try {
      await purgeOfflineCaches();
      const res = await fetch('/api/auth/area', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area, ctId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.home) {
        window.location.href = data.home;
      } else if (home) {
        window.location.href = home;
      }
    } finally {
      setSwitching(null);
    }
  };

  return { areas, loading, switching, selectArea };
}

