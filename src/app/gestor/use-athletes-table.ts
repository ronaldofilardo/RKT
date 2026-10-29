import { useState } from 'react';
import type { AthleteItem } from './types';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

export function useAthletesTableHandlers({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  const [editing, setEditing] = useState<AthleteItem | null>(null);
  const [linkData, setLinkData] = useState<{ open: boolean; name: string; token: string; expiresAt?: string }>({
    open: false, name: '', token: '',
  });
  const { toast } = useToast();

  const handleGenerateLink = async (a: AthleteItem) => {
    try {
      const res = await fetch(`/api/gestor/athletes/${a.player.id}/regenerate-link`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao gerar link');
      setLinkData({ open: true, name: a.player.name, token: data.token, expiresAt: data.expiresAt });
      onRefresh?.();
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao gerar link') });
    }
  };

  const handleSave = async (data: { name: string; cpf: string; birthDate: string; gender: string; dominance: string }) => {
    if (!editing) return;
    const res = await fetch(`/api/gestor/athletes/${editing.player.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error || 'Falha ao atualizar atleta');
    onRefresh?.();
  };

  return {
    editing,
    setEditing,
    linkData,
    setLinkData,
    handleGenerateLink,
    handleSave,
  };
}
