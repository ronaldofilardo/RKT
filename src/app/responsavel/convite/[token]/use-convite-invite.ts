'use client';

import { useEffect, useState } from 'react';

export interface ConviteInviteData {
  minorName: string;
  trainingCenterName: string;
  preGuardianName?: string | null;
  hasPreRegisteredCpf: boolean;
  preGuardianCpfMasked?: string | null;
  expiresAt: string;
}

export function useConviteInvite(token: string) {
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<ConviteInviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/guardians/invites/${token}`);
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.message || 'Convite inválido ou expirado.');
          setInviteData(null);
        } else {
          setInviteData(data);
          setError(null);
        }
      } catch {
        if (active) setError('Não foi possível carregar os dados deste convite.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [token]);

  return { loading, inviteData, error };
}
