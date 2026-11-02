'use client';

import { useState, useRef, useEffect } from 'react';
import type { Athlete } from '../types';
import type { RankingType } from '@/lib/ranking/rankingConstants';
import { useAge } from '../hooks/useAge';
import {
  type RankingState,
  initialRankings,
  assignCategoryAutomatically,
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
  uf: '',
  city: '',
  club: '',
};

interface UseNewAthleteModalOptions {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
  myClub?: boolean;
  ctId?: string | null;
}

export function useNewAthleteModal({
  isOpen, onClose, onCreated, myClub = false, ctId = null,
}: UseNewAthleteModalOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [clubData, setClubData] = useState<{ uf: string; city: string; club: string } | null>(null);
  const [form, setForm] = useState<EMPTY_FORM_TYPE>({ ...EMPTY_FORM });
  const [rankings, setRankings] = useState<Record<RankingType, RankingState>>(initialRankings());

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
    }
  }, [isOpen]);

  const age = useAge(form.birthYear, form.birthMonth, form.birthDay);

  // Quando cadastra atleta do próprio clube, preenche automaticamente
  // estado, cidade e clube com os dados do CT/clube do usuário.
  useEffect(() => {
    if (!isOpen || !(myClub && ctId)) return;
    let cancelled = false;
    fetch(`/api/gestor/club`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const ct = data?.data || data;
        const addr = ct?.address || {};
        setClubData({
          uf: (addr.estado || addr.state || '') as string,
          city: (addr.cidade || addr.city || '') as string,
          club: (ct.name || '') as string,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, myClub, ctId]);

  useEffect(() => {
    assignCategoryAutomatically(setRankings, age);
  }, [age]);

  // Hidrata os campos de origem com os dados do clube quando disponíveis
  useEffect(() => {
    if (!clubData) return;
    setForm((prev) => ({
      ...prev,
      uf: clubData.uf,
      city: clubData.city,
      club: clubData.club,
    }));
  }, [clubData]);

  const submitNewAthleteForm = async (e: React.FormEvent) => {
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
      const payload = buildAthletePayload(form, rankings);
      if (myClub && ctId) {
        (payload as Record<string, unknown>).myClub = true;
        (payload as Record<string, unknown>).ctId = ctId;
      } else {
        (payload as Record<string, unknown>).myClub = false;
      }
      if (form.uf) (payload as Record<string, unknown>).state = form.uf;
      if (form.city) (payload as Record<string, unknown>).city = form.city;
      if (form.club) (payload as Record<string, unknown>).club = form.club;

      const json = await playersClient.create(payload, token);
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
      setClubData(null);
      setRankings(initialRankings());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar atleta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, error, nameInputRef, form, setForm, rankings, setRankings, age, submitNewAthleteForm, clubData };
}

type EMPTY_FORM_TYPE = typeof EMPTY_FORM;
