'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { fetchAthletes } from './useAtletasController.helpers';

export interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
  juvenilePosition?: number;
}

export interface Athlete {
  id: string;
  name: string;
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
  dominance?: string | null;
  backhand?: string | null;
  ranking?: number | null;
  rankings?: Record<string, RankingEntry> | null;
}

export type AthleteSaveData = {
  name: string;
  gender?: string;
  birthDate?: string;
  dominance?: string;
  backhand?: string;
  rankings?: Record<string, RankingEntry>;
};

export function useAtletasController() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [, setSaving] = useState(false);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('user_id') : null;

  const loadAthletes = useCallback(async () => {
    setError(null);
    try {
      if (!userId) {
        setAthletes([]);
        return;
      }
      setAthletes(await fetchAthletes(userId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atletas');
    }
  }, [token, userId]);

  useEffect(() => {
    const userRole = sessionStorage.getItem('user_role');
    const accessToken = sessionStorage.getItem('access_token');
    if (!userRole || !accessToken) {
      router.push('/login');
      return;
    }
    loadAthletes().finally(() => setLoading(false));
  }, [router, loadAthletes]);

  const handleSave = async (data: AthleteSaveData) => {
    if (!editingAthlete) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${editingAthlete.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const responseData = await res.json();
        throw new Error(responseData.message || 'Erro ao salvar');
      }
      setEditingAthlete(null);
      await loadAthletes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!athleteToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${athleteToDelete.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Erro ao excluir atleta');
      }
      setAthleteToDelete(null);
      await loadAthletes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir atleta');
    } finally {
      setDeleting(false);
    }
  };

  logger.info('[AtletasPage] mount');
  return { router, loading, athletes, error, editingAthlete, setEditingAthlete, showNewAthleteModal, setShowNewAthleteModal, athleteToDelete, setAthleteToDelete, deleting, loadAthletes, handleSave, handleConfirmDelete };
}
