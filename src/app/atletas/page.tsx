'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { NewAthleteModal } from '@/app/match/new/components/NewAthleteModal';
import { EditAthleteModal } from './EditAthleteModal';
import {
  RANKING_TYPE_LABELS,
  RankingType,
} from '@/app/match/new/rankingConstants';
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
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('user_id') : null;

  const loadAthletes = useCallback(async () => {
    setError(null);
    try {
      if (!userId) {
        setAthletes([]);
        return;
      }

      const res = await fetch(`/api/players?userId=${encodeURIComponent(userId)}`, {
        headers: { authorization: `Bearer ${token}` },
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

  const handleSave = async (data: {
    name: string;
    gender?: string;
    birthDate?: string;
    dominance?: string;
    backhand?: string;
    rankings?: Record<string, RankingEntry>;
  }) => {
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
        const data = await res.json();
        throw new Error(data.message || 'Erro ao salvar');
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

  const formatBirthDate = (bd: string | null | undefined) => {
    if (!bd) return null;
    const d = new Date(bd);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatRankings = (rankings: Record<string, RankingEntry> | null | undefined) => {
    if (!rankings || Object.keys(rankings).length === 0) return null;
    return Object.entries(rankings).map(([type, entry]) => {
      const label = RANKING_TYPE_LABELS[type as RankingType] || type;
      let txt = `${label} #${entry.position}`;
      if (entry.category) txt += ` (${entry.category}`;
      if (entry.class) txt += ` ${entry.class}`;
      if (entry.category) txt += ')';
      if (entry.juvenilePosition) txt += ` · JJ #${entry.juvenilePosition}`;
      return txt;
    });
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              aria-label="Voltar para o dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Atletas</h1>
            <span className="bg-sky-100 text-sky-700 text-xs font-semibold px-2 py-1 rounded-full">
              {athletes.length}
            </span>
          </div>
          <button
            onClick={() => setShowNewAthleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Atleta
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {athletes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum atleta cadastrado</h3>
            <p className="text-gray-500">Cadastre atletas para começar a utilizar o sistema.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-800">Atletas Cadastrados</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sexo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nascimento</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Idade</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Dominância</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Backhand</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rankings</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {athletes.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{a.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          a.gender === 'MALE' ? 'bg-blue-100 text-blue-800' :
                          a.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {a.gender === 'MALE' ? 'M' : a.gender === 'FEMALE' ? 'F' : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatBirthDate(a.birthDate) || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {a.age != null ? (
                          <span className="text-sm font-medium text-gray-900">{a.age} anos</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.dominance === 'RIGHT' ? 'Destro' : a.dominance === 'LEFT' ? 'Canhoto' : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.backhand === 'ONE_HANDED' ? '1 mão' : a.backhand === 'TWO_HANDED' ? '2 mãos' : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const rankingList = formatRankings(a.rankings);
                          if (!rankingList) return <span className="text-gray-400 text-sm">-</span>;
                          return (
                            <div className="flex flex-wrap gap-1">
                              {rankingList.map((r, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">
                                  {r}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setEditingAthlete(a)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => setAthleteToDelete(a)}
                            aria-label={`Excluir atleta ${a.name}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <EditAthleteModal
        athlete={editingAthlete}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          onKeyDown={(e) => { if (e.key === 'Escape' && !deleting) setAthleteToDelete(null); }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { if (!deleting) setAthleteToDelete(null); }}
            role="button"
            tabIndex={-1}
            aria-label="Fechar modal"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAthleteToDelete(null); }}
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
                onClick={() => handleConfirmDelete()}
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