import { useEffect, useState } from 'react';
import type { BillingAccountState } from '@/types/billing';

export function useDashboardAuthMe() {
  const [ctId, setCtId] = useState<string | null>(null);
  const [ctName, setCtName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [followedPlayerIds, setFollowedPlayerIds] = useState<string[]>([]);
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingAccountState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          const activeId = data.activeContextId ?? null;
          setCtId(activeId);
          setUserId(data.user?.id ?? null);
          setUserName(data.user?.name ?? null);
          setFollowedPlayerIds(data.followedPlayerIds ?? []);
          setActiveArea(data.activeArea ?? null);
          setBilling(data.billing ?? null);
          if (activeId && activeId !== 'PARTICULAR') {
            const currentMem = data.memberships?.find((m: any) => m.ctId === activeId);
            const currentCtx = data.availableContexts?.find((c: any) => c.id === activeId);
            setCtName(currentMem?.ct?.name || currentCtx?.label?.split(' (')[0] || null);
          } else {
            setCtName(null);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return { ctId, ctName, userId, userName, followedPlayerIds, activeArea, billing };
}
