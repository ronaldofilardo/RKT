'use client';

import { useCallback, useEffect, useState } from 'react';
import { isMinor } from '@/core/access/age';
import {
  fetchCurrentPlayerId,
  fetchPlayerProfile,
  requestNicknameSave,
  requestPoolVisibility,
} from './profile-public.api';

export function useProfilePublic() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [poolVisible, setPoolVisible] = useState(false);
  const [minor, setMinor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const id = await fetchCurrentPlayerId();
        if (!id || cancelled) return;
        setPlayerId(id);
        const player = await fetchPlayerProfile(id);
        if (!player || cancelled) return;
        setNickname(player.nickname ?? '');
        setPoolVisible(Boolean(player.poolVisible));
        setMinor(isMinor(player.birthDate ? new Date(player.birthDate) : null, new Date()));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const saveNickname = useCallback(async (value: string) => {
    if (!playerId) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      const { status, body } = await requestNicknameSave(playerId, value.trim());
      if (status === 409) setError('Este apelido já está em uso. Escolha outro.');
      else if (status >= 400) setError(body.message ?? 'Não foi possível salvar o apelido.');
      else { setNickname(body.nickname ?? ''); setMessage('Apelido salvo.'); }
    } catch {
      setError('Não foi possível salvar o apelido.');
    } finally {
      setSaving(false);
    }
  }, [playerId]);

  const toggleVisibility = useCallback(async (visible: boolean) => {
    if (!playerId) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      const { status, body } = await requestPoolVisibility(playerId, visible);
      if (status === 403) setError(body.message ?? 'É necessário consentimento do responsável para atletas menores.');
      else if (status >= 400) setError(body.message ?? 'Não foi possível alterar a visibilidade.');
      else {
        setPoolVisible(Boolean(body.data?.poolVisible));
        setMessage(visible ? 'Você agora aparece no pool público.' : 'Você não aparece mais no pool público.');
      }
    } catch {
      setError('Não foi possível alterar a visibilidade.');
    } finally {
      setSaving(false);
    }
  }, [playerId]);

  return {
    playerId, nickname, poolVisible, minor, loading, saving, message, error,
    saveNickname, toggleVisibility,
  };
}
