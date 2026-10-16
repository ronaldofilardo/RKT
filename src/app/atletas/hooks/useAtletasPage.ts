'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
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
    // A autenticação real é o cookie httpOnly `rkt_access_token` (validado pelo
    // middleware e pela API). O sessionStorage guarda apenas user_id/user_role —
    // `access_token` NÃO é mais gravado no login, então exigi-lo aqui mandava o
    // usuário SEMPRE de volta para /login ao abrir "Atletas" pelo menu.
    const userRole = sessionStorage.getItem('user_role');
    if (!userRole) {
      router.push('/login');
      return;
    }
    loadAthletes().finally(() => setLoading(false));
  }, [router, loadAthletes]);

  const handleSave = async (data: EditAthleteSavePayload) => {
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

  const handleConfirmDelete = async () => {
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
    loading,
    athletes,
    error,
    editingAthlete,
    setEditingAthlete,
    showNewAthleteModal,
    setShowNewAthleteModal,
    athleteToDelete,
    setAthleteToDelete,
    deleting,
    handleSave,
    handleConfirmDelete,
    loadAthletes,
  };
}
