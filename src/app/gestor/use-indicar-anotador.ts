import { useState, useEffect } from 'react';
import type { ClubMatchItem, CoachItem } from './types';

export function useIndicarAnotador(
  match: ClubMatchItem | null,
  coaches: CoachItem[],
  onOpenChange: (open: boolean) => void,
  onSuccess: () => void,
) {
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      const existing =
        match.assignedCoaches && match.assignedCoaches.length > 0
          ? match.assignedCoaches.map((ac) => ac.coach.id).filter(Boolean)
          : match.assignedCoachId
          ? [match.assignedCoachId]
          : coaches[0]?.user.id
          ? [coaches[0].user.id]
          : [];
      setSelectedCoachIds(existing);
      setError(null);
    }
  }, [match, coaches]);

  function toggleCoach(coachId: string) {
    setSelectedCoachIds((prev) =>
      prev.includes(coachId) ? prev.filter((id) => id !== coachId) : [...prev, coachId],
    );
  }

  async function handleConfirm() {
    if (selectedCoachIds.length === 0) {
      setError('Selecione ao menos um treinador ou anotador.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload =
        selectedCoachIds.length === 1
          ? { coachUserId: selectedCoachIds[0] }
          : { coachUserId: selectedCoachIds[0], coachUserIds: selectedCoachIds };

      const res = await fetch(`/api/gestor/matches/${match!.id}/assign`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao indicar anotador');
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setSubmitting(false);
    }
  }

  return { selectedCoachIds, submitting, error, toggleCoach, handleConfirm };
}
