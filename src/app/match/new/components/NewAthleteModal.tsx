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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
      />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-telemetry-elevated border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-telemetry-text-primary">Novo Atleta</h2>
            <p className="text-xs text-telemetry-text-muted">Preencha os dados do jogador</p>
          </div>
          <button type="button" onClick={onClose} className="text-telemetry-text-muted hover:text-telemetry-text-primary text-2xl p-1 transition-colors">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-sm rounded-lg">{error}</div>
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
              className="flex-1 bg-transparent border border-white/10 text-telemetry-text-muted font-semibold py-2.5 rounded-lg hover:bg-telemetry-elevated hover:text-telemetry-text-primary disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex-1 bg-telemetry-blue text-white font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-[0_0_12px_rgba(37,99,235,0.3)]"
            >
              {submitting ? 'Salvando...' : 'Salvar Atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}