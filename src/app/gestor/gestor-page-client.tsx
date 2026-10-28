"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MeResponse, GestorTab } from './types';
import { fetchMe } from './data-logic';
import { GestorLoading } from './loading';
import { GestorError } from './error-state';
import { PendingStatus } from './status-pages';
import { SuspendedStatus } from './status-pages';
import { GestorDashboard } from './dashboard';

interface GestorPageClientProps {
  me: MeResponse | null;
  error: string | null;
}

export function GestorPageClient({
  me: initialMe,
  error: initialError = null,
}: GestorPageClientProps) {
  const [me, setMe] = useState<MeResponse | null>(initialMe);
  const [tab, setTab] = useState<GestorTab>('coaches');
  const [error, setError] = useState(initialError);

  const fetchMeData = useCallback(async () => {
    try {
      const data = await fetchMe();
      setMe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    }
  }, []);

  useEffect(() => {
    if (!initialMe) {
      fetchMeData();
    }
  }, [initialMe, fetchMeData]);

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
