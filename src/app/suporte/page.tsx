"use client";

import { useState, useEffect, useCallback } from 'react';
import type { TrainingCenter, UserItem, MembershipItem, SuporteData, ExternosData } from './types';
import SuportePageContent from './suporte-page-content';

async function apiFetchClubs(): Promise<TrainingCenter[]> {
  const res = await fetch('/api/training-centers');
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

async function apiFetchUsers(): Promise<UserItem[]> {
  const res = await fetch('/api/users');
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

async function apiFetchMemberships(): Promise<MembershipItem[]> {
  const res = await fetch('/api/memberships');
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

async function apiFetchExternos(): Promise<ExternosData | null> {
  const res = await fetch('/api/suporte/externos');
  if (!res.ok) return null;
  return res.json();
}

async function loadSuporteData(): Promise<SuporteData> {
  const [c, u, m, e] = await Promise.all([
    apiFetchClubs(),
    apiFetchUsers(),
    apiFetchMemberships(),
    apiFetchExternos(),
  ]);
  return { clubs: c, users: u, memberships: m, externos: e };
}

export default function SuportePage() {
  const [data, setData] = useState<SuporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const result = await loadSuporteData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <SuportePageContent
      data={data}
      loading={loading}
      error={error}
      setError={setError}
      onRetry={loadData}
    />
  );
}
