'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { ensureSessionHydrated } from '@/lib/auth-client';
import { playersClient } from '@/services/playersClient';
import type { EditAthleteSavePayload } from '../EditAthleteModal';
import type { Athlete } from '../atletas.types';

export function useAtletasPage() {
  const router = useRouter();
  logger.info('[AtletasPage] mount');
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [, setSaving] = useState(false);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  const loadAthletes = useCallback(async () => {
    setError(null);
    try {
      const currentToken = sessionStorage.getItem('access_token');
      const currentUserId = sessionStorage.getItem('user_id');
      if (!currentUserId) {
        setAthletes([]);
        return;
      }

      const json = await playersClient.list(currentUserId, currentToken);
      const players = json?.data?.players ?? json?.players ?? [];
      setAthletes(Array.isArray(players) ? players : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atletas');
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const userRole = typeof window !== 'undefined' ? sessionStorage.getItem('user_role') : null;
      if (!userRole) {
        router.push('/login');
        return;
      }
      const isOk = await ensureSessionHydrated(router);
      if (!isOk || !active) return;
      loadAthletes().finally(() => {
        if (active) setLoading(false);
      });
    })();
    return () => { active = false; };
  }, [router, loadAthletes]);

  const saveAthleteChanges = async (data: EditAthleteSavePayload) => {
    if (!editingAthlete) return;
    setSaving(true);
    setError(null);
    try {
      await playersClient.update(editingAthlete.id, data, token);
      setEditingAthlete(null);
      await loadAthletes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const confirmAthleteDeletion = async () => {
    if (!athleteToDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await playersClient.remove(athleteToDelete.id, token);
      setAthleteToDelete(null);
      await loadAthletes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir atleta');
    } finally {
      setDeleting(false);
    }
  };

  return {
    loading, athletes, error, editingAthlete, setEditingAthlete,
    showNewAthleteModal, setShowNewAthleteModal, athleteToDelete, setAthleteToDelete, deleting,
    currentUserId: typeof window !== 'undefined' ? sessionStorage.getItem('user_id') : null,
    userRole: typeof window !== 'undefined' ? sessionStorage.getItem('user_role') : null,
    saveAthleteChanges, confirmAthleteDeletion, loadAthletes,
  };
}
