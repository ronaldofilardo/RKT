'use client';

import { useEffect } from 'react';
import type { Athlete } from '../types';
import { useNewAthleteModalForm } from './use-new-athlete-modal-form';
import { useNewAthleteModalClub } from './use-new-athlete-modal-club';
import { useNewAthleteModalRankings } from './use-new-athlete-modal-rankings';
import { useNewAthleteModalFocus } from './use-new-athlete-modal-focus';

interface UseNewAthleteModalOptions {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
  myClub?: boolean;
  ctId?: string | null;
}

export function useNewAthleteModal({
  isOpen,
  onClose,
  onCreated,
  myClub = false,
  ctId = null,
}: UseNewAthleteModalOptions) {
  const { nameInputRef } = useNewAthleteModalFocus(isOpen);

  const {
    submitting,
    error,
    form,
    setForm,
    rankings,
    setRankings,
    submitNewAthleteForm,
    resetForm,
  } = useNewAthleteModalForm({
    onCreated,
    onClose,
    myClub,
    ctId,
  });

  const { clubData, setClubData } = useNewAthleteModalClub({
    isOpen,
    myClub,
    ctId,
  });

  const { age } = useNewAthleteModalRankings({
    form,
    setRankings,
  });

  // Hidrata os campos de origem com os dados do clube quando disponíveis
  // biome-ignore lint/correctness/useExhaustiveDependencies: clubData é intencionalmente usado apenas para efeito colateral
  useEffect(() => {
    if (!clubData) return;
    setForm((prev) => ({
      ...prev,
      uf: clubData.uf,
      city: clubData.city,
      club: clubData.club,
    }));
  }, [clubData, setForm]);

  return {
    submitting,
    error,
    nameInputRef,
    form,
    setForm,
    rankings,
    setRankings,
    age,
    submitNewAthleteForm,
    clubData,
    setClubData,
    resetForm,
  };
}