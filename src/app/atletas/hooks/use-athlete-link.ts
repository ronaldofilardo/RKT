import { useState } from 'react';
import type { Athlete } from '../atletas.types';

export interface AthleteLinkData {
  token: string;
  expiresAt: string;
  recipientName: string;
}

export function useAthleteLink() {
  const [linkData, setLinkData] = useState<AthleteLinkData | null>(null);
  const [loadingLinkId, setLoadingLinkId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const generateLink = async (athlete: Athlete) => {
    setLoadingLinkId(athlete.id);
    setLinkError(null);
    try {
      const res = await fetch(`/api/coach/athletes/${athlete.id}/regenerate-link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao gerar link');
      }
      setLinkData({
        token: data.token,
        expiresAt: data.expiresAt,
        recipientName: athlete.name,
      });
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Erro ao gerar link de acesso');
    } finally {
      setLoadingLinkId(null);
    }
  };

  const closeLinkModal = () => {
    setLinkData(null);
    setLinkError(null);
  };

  return {
    linkData,
    loadingLinkId,
    linkError,
    generateLink,
    closeLinkModal,
  };
}
