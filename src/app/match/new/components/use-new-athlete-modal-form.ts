'use client';

import { useState, useCallback } from 'react';
import type { AthleteForm } from '@/app/atletas/types';
import { buildAthletePayload, validateAthleteForm } from './new-athlete-modal.logic';
import { playersClient } from '@/services/playersClient';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import type { RankingState } from '@/app/atletas/rankingLogic';
import { initialRankings } from '@/app/atletas/rankingLogic';

const EMPTY_FORM: AthleteForm = {
  name: '', gender: '', birthDay: '', birthMonth: '', birthYear: '',
  dominance: '', backhand: '', uf: '', city: '', club: '',
};

export function useNewAthleteModalForm({
  onCreated, onClose, myClub = false, ctId = null,
}: { onCreated: (a: { id: string; name: string; gender?: string; age?: number; dominance?: string; backhand?: string; ranking?: number }) => void; onClose: () => void; myClub?: boolean; ctId?: string | null; }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AthleteForm>({ ...EMPTY_FORM });
  const [rankings, setRankings] = useState<Record<RankingType, RankingState>>(initialRankings());

  const submitNewAthleteForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateAthleteForm(form);
    if (validationError) { setError(validationError); return; }

    setSubmitting(true); setError(null);
    try {
      const token = sessionStorage.getItem('access_token');
      const payload = buildAthletePayload(form, rankings);
      (payload as Record<string, unknown>).myClub = myClub;
      if (myClub && ctId) (payload as Record<string, unknown>).ctId = ctId;
      if (form.uf) (payload as Record<string, unknown>).state = form.uf;
      if (form.city) (payload as Record<string, unknown>).city = form.city;
      if (form.club) (payload as Record<string, unknown>).club = form.club;

      const json = await playersClient.create(payload, token);
      const player = json?.data || json;

      onCreated({ id: player.id, name: player.name, gender: player.gender, age: player.age, dominance: player.dominance, backhand: player.backhand, ranking: player.ranking });
      setForm({ ...EMPTY_FORM }); setRankings(initialRankings()); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao criar atleta. Tente novamente.'); }
    finally { setSubmitting(false); }
  }, [form, rankings, myClub, ctId, onCreated, onClose]);

  const resetForm = useCallback(() => { setForm({ ...EMPTY_FORM }); setRankings(initialRankings()); setError(null); }, []);

  return { submitting, error, form, setForm, rankings, setRankings, submitNewAthleteForm, resetForm };
}