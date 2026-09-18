'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NewAthleteModal } from '@/app/match/new/components/NewAthleteModal';
import { EditAthleteModal } from './EditAthleteModal';
import { AthleteSearchHeader } from './components/AthleteSearchHeader';
import { AthleteListTable } from './components/AthleteListTable';
import { logger } from '@/lib/logger';

interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
  juvenilePosition?: number;
}

interface Athlete {
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

export default function AtletasPage() {
  const router = useRouter();
  logger.info("[AtletasPage] mount");
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

      const res = await fetch(`/api/players?userId=${encodeURIComponent(currentUserId)}`, {
        headers: { authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Erro ao carregar atletas');
      }
      const json = await res.json();
      const players = json?.data?.players ?? json?.players ?? [];
      setAthletes(Array.isArray(players) ? players : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atletas');
    }
  }, []);

  useEffect(() => {
    const userRole = sessionStorage.getItem('user_role');
    const accessToken = sessionStorage.getItem('access_token');
    if (!userRole || !accessToken) {
      router.push('/login');
      return;
    }
    loadAthletes().finally(() => setLoading(false));
  }, [router, loadAthletes]);

  const handleSave = async (data: any) => {
    if (!editingAthlete) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${editingAthlete.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Erro ao salvar');
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
      const res = await fetch(`/api/players/${athleteToDelete.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-700 text-lg font-medium">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AthleteSearchHeader
        athleteCount={athletes.length}
        onNewAthlete={() => setShowNewAthleteModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <AthleteListTable
          athletes={athletes}
          onEditAthlete={setEditingAthlete}
          onDeleteAthlete={setAthleteToDelete}
        />
      </main>

      <EditAthleteModal
        athlete={editingAthlete as any}
        isOpen={!!editingAthlete}
        onClose={() => setEditingAthlete(null)}
        onSave={handleSave}
      />

      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={() => { setShowNewAthleteModal(false); loadAthletes(); }}
      />

      {athleteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { if (!deleting) setAthleteToDelete(null); }}
            role="button"
            tabIndex={-1}
            aria-label="Fechar modal"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (!deleting) setAthleteToDelete(null);
              }
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Atleta</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja excluir <span className="font-semibold text-gray-900">{athleteToDelete.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Caso o atleta possua partidas em andamento ou finalizadas, a exclusão será bloqueada para não afetar essas partidas.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAthleteToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}