'use client';

import { useState, useRef, useEffect } from 'react';
import type { Athlete } from '../types';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import { useAge } from '../hooks/useAge';
import {
  type RankingState,
  initialRankings,
  handleAutoCategoryAssignment,
} from '@/app/atletas/rankingLogic';
import { buildAthletePayload, validateAthleteForm } from './new-athlete-modal.logic';
import { playersClient } from '@/services/playersClient';

const EMPTY_FORM = {
  name: '',
  gender: '',
  birthDay: '',
  birthMonth: '',
  birthYear: '',
  dominance: '',
  backhand: '',
};

interface UseNewAthleteModalOptions {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
}

export function useNewAthleteModal({ isOpen, onClose, onCreated }: UseNewAthleteModalOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
    }
  }, [isOpen]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [rankings, setRankings] = useState<Record<RankingType, RankingState>>(initialRankings());
  const age = useAge(form.birthYear, form.birthMonth, form.birthDay);

  useEffect(() => {
    handleAutoCategoryAssignment(setRankings, age);
  }, [age]);

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

      const json = await playersClient.create(payload, token, userId);
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

      setForm(EMPTY_FORM);
      setRankings(initialRankings());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar atleta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, error, nameInputRef, form, setForm, rankings, setRankings, age, handleSubmit };
}
