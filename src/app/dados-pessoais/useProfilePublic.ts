'use client';

import { useCallback, useEffect, useState } from 'react';
import { isMinor } from '@/core/access/age';
import {
  fetchCurrentIdentity, fetchPlayerProfile, requestNicknameSave, requestPoolVisibility, requestPersonalDataSave,
} from './profile-public.api';

export function useProfilePublic() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
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
        const identity = await fetchCurrentIdentity();
        if (!identity || cancelled) return;
        setName(identity.name);
        setCpf(identity.cpf);
        if (!identity.playerId) return;
        setPlayerId(identity.playerId);
        const player = await fetchPlayerProfile(identity.playerId);
        if (!player || cancelled) return;
        setBirthDate(player.birthDate ?? null);
        setNickname(player.nickname ?? '');
        setPoolVisible(Boolean(player.poolVisible));
        setMinor(isMinor(player.birthDate ? new Date(player.birthDate) : null, new Date()));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const savePersonalData = useCallback(async (newName: string) => {
    setSaving(true); setError(null); setMessage(null);
    try {
      const { status, body } = await requestPersonalDataSave(newName.trim());
      if (status >= 400) setError(body.message ?? 'Não foi possível salvar os dados pessoais.');
      else { setName(body.name ?? newName.trim()); setMessage('Dados pessoais atualizados com sucesso.'); }
    } catch {
      setError('Erro ao salvar os dados pessoais.');
    } finally {
      setSaving(false);
    }
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
    playerId, name, cpf, birthDate, nickname, poolVisible, minor, loading, saving, message, error,
    savePersonalData, saveNickname, toggleVisibility,
  };
}
