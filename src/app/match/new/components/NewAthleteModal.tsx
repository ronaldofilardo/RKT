'use client';

import { useState, useRef, useEffect } from 'react';
import type { Athlete } from '../types';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import { useAge } from '../hooks/useAge';
import {
  type RankingState,
  initialRankings,
  handleRankingToggle,
  handleRankingFieldChange,
  handleAutoCategoryAssignment,
} from '@/app/atletas/rankingLogic';
import { NewAthleteModalForm } from './NewAthleteModalForm';
import { buildAthletePayload, validateAthleteForm } from './new-athlete-modal.helpers';

interface NewAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
}

export function NewAthleteModal({ isOpen, onClose, onCreated }: NewAthleteModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
    }
  }, [isOpen]);

  const [form, setForm] = useState({
    name: '',
    gender: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    dominance: '',
    backhand: '',
  });

  const [rankings, setRankings] = useState<Record<RankingType, RankingState>>(initialRankings());

  const age = useAge(form.birthYear, form.birthMonth, form.birthDay);
  
  useEffect(() => {
    handleAutoCategoryAssignment(setRankings, age);
  }, [age]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateAthleteForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access_token');
      const userId = sessionStorage.getItem('user_id');
      const payload = buildAthletePayload(form, rankings);

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
          'x-user-id': userId || '',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar atleta');
      }

      const json = await res.json();
      const player = json?.data || json;

      onCreated({
        id: player.id,
        name: player.name,
        gender: player.gender,
        age: player.age,
        dominance: player.dominance,
        backhand: player.backhand,
        ranking: player.ranking,
      });

      setForm({ name: '', gender: '', birthDay: '', birthMonth: '', birthYear: '', dominance: '', backhand: '' });
      setRankings(initialRankings());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar atleta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Atleta</h2>
            <p className="text-xs text-gray-500">Preencha os dados do jogador</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-1">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          <NewAthleteModalForm
            form={form}
            setForm={setForm}
            rankings={rankings}
            setRankings={setRankings}
            age={age}
            submitting={submitting}
            nameInputRef={nameInputRef}
            onRankingToggle={(type) => handleRankingToggle(setRankings, type)}
            onRankingFieldChange={(type, field, value) => handleRankingFieldChange(setRankings, type, field, value)}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-lg hover:bg-sky-700 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar Atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}