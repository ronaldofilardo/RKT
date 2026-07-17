'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { NewAthleteModal } from '@/app/match/new/components/NewAthleteModal';
import {
  RANKING_TYPES,
  RANKING_TYPE_LABELS,
  RankingType,
  calculateAgeFromYear,
  hasCategories,
  hasClasses,
  getCategoriesForAge,
  getClassesForSelection,
} from '@/app/match/new/rankingConstants';

interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
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

interface RankingState {
  enabled: boolean;
  category: string;
  class: string;
  position: string;
}

function createEmptyRankingState(): RankingState {
  return { enabled: false, category: '', class: '', position: '' };
}

function athleteToRankingsState(rankings: Record<string, RankingEntry> | null | undefined): Record<RankingType, RankingState> {
  const state = {
    ESTADUAL: createEmptyRankingState(),
    CBT: createEmptyRankingState(),
    COSAT: createEmptyRankingState(),
    ITF: createEmptyRankingState(),
    ATP: createEmptyRankingState(),
    WTA: createEmptyRankingState(),
  };
  if (!rankings) return state;
  for (const [type, entry] of Object.entries(rankings)) {
    if (type in state) {
      state[type as RankingType] = {
        enabled: true,
        category: entry.category || '',
        class: entry.class || '',
        position: String(entry.position || ''),
      };
    }
  }
  return state;
}

function rankingsStateToPayload(state: Record<RankingType, RankingState>): Record<string, RankingEntry> | undefined {
  const payload: Record<string, RankingEntry> = {};
  for (const [type, s] of Object.entries(state) as [RankingType, RankingState][]) {
    if (s.enabled && s.position) {
      const entry: RankingEntry = { position: parseInt(s.position) };
      if (s.category) entry.category = s.category;
      if (s.class) entry.class = s.class;
      payload[type] = entry;
    }
  }
  return Object.keys(payload).length > 0 ? payload : undefined;
}

export default function AtletasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [form, setForm] = useState({
    name: '',
    gender: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    dominance: '',
    backhand: '',
  });
  const [rankings, setRankings] = useState<Record<RankingType, RankingState>>({
    ESTADUAL: createEmptyRankingState(),
    CBT: createEmptyRankingState(),
    COSAT: createEmptyRankingState(),
    ITF: createEmptyRankingState(),
    ATP: createEmptyRankingState(),
    WTA: createEmptyRankingState(),
  });
  const [saving, setSaving] = useState(false);
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);

  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('user_id') : null;

  const age = useMemo(() => {
    const y = parseInt(form.birthYear);
    return isNaN(y) ? null : calculateAgeFromYear(y);
  }, [form.birthYear]);

  const loadAthletes = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/players?userId=${userId}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao carregar atletas');
      const data = await res.json();
      setAthletes(data.players || []);
    } catch {
      setError('Erro ao carregar atletas');
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

  const handleEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    const bd = athlete.birthDate ? new Date(athlete.birthDate) : null;
    setForm({
      name: athlete.name || '',
      gender: athlete.gender || '',
      birthDay: bd ? String(bd.getDate()) : '',
      birthMonth: bd ? String(bd.getMonth() + 1) : '',
      birthYear: bd ? String(bd.getFullYear()) : '',
      dominance: athlete.dominance || '',
      backhand: athlete.backhand || '',
    });
    setRankings(athleteToRankingsState(athlete.rankings));
  };

  const handleSave = async () => {
    if (!editingAthlete || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const birthDate = form.birthYear && form.birthMonth && form.birthDay
        ? `${form.birthYear}-${form.birthMonth.padStart(2, '0')}-${form.birthDay.padStart(2, '0')}`
        : undefined;

      const res = await fetch(`/api/players/${editingAthlete.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          gender: form.gender || undefined,
          birthDate,
          dominance: form.dominance || undefined,
          backhand: form.backhand || undefined,
          rankings: rankingsStateToPayload(rankings),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao salvar');
      }
      setEditingAthlete(null);
      await loadAthletes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleRankingToggle = (type: RankingType) => {
    setRankings((prev) => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled, category: '', class: '', position: '' },
    }));
  };

  const handleRankingFieldChange = (type: RankingType, field: keyof RankingState, value: string) => {
    setRankings((prev) => {
      const updated = { ...prev[type], [field]: value };
      if (field === 'category') updated.class = '';
      return { ...prev, [type]: updated };
    });
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
      return txt;
    });
  };

  const availableTypes = useMemo(() => {
    if (age === null) return RANKING_TYPES;
    return RANKING_TYPES.filter((type) => {
      if (!hasCategories(type)) return true;
      return getCategoriesForAge(type, age).length > 0;
    });
  }, [age]);

  const renderRankingRow = (type: RankingType) => {
    const state = rankings[type];
    const showCategory = hasCategories(type) && age !== null;
    const showClass = hasClasses(type) && state.category !== '' && form.gender !== '';
    const categories = age !== null ? getCategoriesForAge(type, age) : [];
    const classes = state.category && form.gender && age !== null
      ? getClassesForSelection(state.category, form.gender, age)
      : [];

    return (
      <div key={type} className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            id={`edit-ranking-${type}`}
            checked={state.enabled}
            onChange={() => handleRankingToggle(type)}
            disabled={saving}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <label htmlFor={`edit-ranking-${type}`} className="text-sm font-medium text-gray-700">
            {RANKING_TYPE_LABELS[type]}
          </label>
        </div>
        {state.enabled && (
          <div className="ml-6 space-y-2">
            {showCategory && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                <select
                  value={state.category}
                  onChange={(e) => handleRankingFieldChange(type, 'category', e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-sm"
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat} anos</option>
                  ))}
                </select>
              </div>
            )}
            {showClass && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Classe</label>
                <select
                  value={state.class}
                  onChange={(e) => handleRankingFieldChange(type, 'class', e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-sm"
                >
                  <option value="">Selecione...</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Posição</label>
              <input
                type="number"
                min="1"
                value={state.position}
                onChange={(e) => handleRankingFieldChange(type, 'position', e.target.value)}
                disabled={saving}
                placeholder="Posição"
                className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
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
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <p className="text-gray-500">Cadastre atletas para开始utilizar o sistema.</p>
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider"> Sexo</th>
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
                        <button
                          onClick={() => handleEdit(a)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {editingAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditingAthlete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Editar Atleta</h2>
                <p className="text-sm text-gray-600">{editingAthlete.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAthlete(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-sm"
                  >
                    <option value="">Selec...</option>
                    <option value="MALE">M</option>
                    <option value="FEMALE">F</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="1" max="31" value={form.birthDay}
                      onChange={(e) => setForm((p) => ({ ...p, birthDay: e.target.value }))}
                      disabled={saving} placeholder="DD" maxLength={2}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-sm" />
                    <span className="text-gray-500 font-medium">/</span>
                    <input type="number" min="1" max="12" value={form.birthMonth}
                      onChange={(e) => setForm((p) => ({ ...p, birthMonth: e.target.value }))}
                      disabled={saving} placeholder="MM" maxLength={2}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-sm" />
                    <span className="text-gray-500 font-medium">/</span>
                    <input type="number" min="1900" max="2030" value={form.birthYear}
                      onChange={(e) => setForm((p) => ({ ...p, birthYear: e.target.value }))}
                      disabled={saving} placeholder="AAAA" maxLength={4}
                      className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 placeholder-gray-400 text-center text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dominância</label>
                  <select
                    value={form.dominance}
                    onChange={(e) => setForm((p) => ({ ...p, dominance: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-sm"
                  >
                    <option value="">Selec...</option>
                    <option value="RIGHT">Destro</option>
                    <option value="LEFT">Canhoto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backhand</label>
                  <select
                    value={form.backhand}
                    onChange={(e) => setForm((p) => ({ ...p, backhand: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-sm"
                  >
                    <option value="">Selec...</option>
                    <option value="ONE_HANDED">1 mão</option>
                    <option value="TWO_HANDED">2 mãos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ranking</label>
                {age !== null && (
                  <p className="text-sm text-gray-600 mb-3 bg-gray-100 px-3 py-2 rounded-lg">
                    Idade calculada: <span className="font-semibold text-gray-900">{age} anos</span>
                  </p>
                )}
                <div className="space-y-2">
                  {availableTypes.map((type) => renderRankingRow(type))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingAthlete(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={() => { setShowNewAthleteModal(false); loadAthletes(); }}
      />
    </div>
  );
}
