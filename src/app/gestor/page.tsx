"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import type { MeResponse, GestorTab } from './types';
import { fetchMe } from './data-logic';
import { GestorLoading } from './loading';
import { GestorError } from './error-state';
import { PendingStatus } from './status-pages';
import { SuspendedStatus } from './status-pages';
import { GestorDashboard } from './dashboard';

export default function GestorPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [tab, setTab] = useState<GestorTab>('coaches');
  const [error, setError] = useState<string | null>(null);

  const fetchMeData = useCallback(async () => {
    try {
      const data = await fetchMe();
      setMe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    }
  }, []);

  useEffect(() => {
    fetchMeData();
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('tab') as GestorTab;
      if (q && ['coaches', 'athletes', 'matches', 'club', 'managers'].includes(q)) setTab(q);
    }
  }, [fetchMeData]);

  if (!me) return <GestorLoading />;
  if (error) return <GestorError error={error} />;
  if (me.ctStatus === 'PENDING') return <PendingStatus />;
  if (me.ctStatus === 'SUSPENDED') return <SuspendedStatus />;

  return (
    <GestorDashboard
      me={me}
      tab={tab}
      setTab={setTab}
    />
  );
}
