import { useState } from 'react';
import type { AthleteItem } from './types';
import type { AthleteLinkModalState } from './athletes-link-modal.types';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

interface AthletesTableHandlersParams {
  onRefresh?: () => void | Promise<void>;
}

export function useAthletesTableHandlers({ onRefresh }: AthletesTableHandlersParams) {
  const [editing, setEditing] = useState<AthleteItem | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<AthleteItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [linkData, setLinkData] = useState<AthleteLinkModalState>({ open: false, name: '', token: '' });
  const { toast } = useToast();

  const handleGenerateLink = async (playerId: string, name: string, mode: 'LINK' | 'ECA' = 'LINK') => {
    try {
      const res = await fetch(`/api/gestor/athletes/${playerId}/regenerate-link`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao gerar link');
      setLinkData({
        open: true, name, token: data.token, playerId, expiresAt: data.expiresAt,
        isMinor: data.isMinor, isConsented: data.isConsented, mode,
        guardianNoticeToken: data.guardianNoticeToken, guardianName: data.guardianName,
      });
      await onRefresh?.();
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao gerar link') });
    }
  };

  const handleSimulateConsent = async () => {
    if (!linkData.playerId) return;
    try {
      const res = await fetch(`/api/gestor/athletes/${linkData.playerId}/simulate-consent`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao simular consentimento');
      setLinkData((prev) => ({ ...prev, isConsented: true }));
      toast({ type: 'success', message: 'Consentimento simulado com sucesso!' });
      void Promise.resolve(onRefresh?.()).catch(() => {});
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Falha ao simular consentimento') });
    }
  };

  const handleSave = async (data: {
    name: string; cpf?: string; birthDate?: string; gender?: string;
    dominance?: string; backhand?: string; rankings?: Record<string, any>;
  }) => {
    if (!editing) return;
    const res = await fetch(`/api/gestor/athletes/${editing.player.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error || 'Falha ao atualizar atleta');
    setEditing(null);
    toast({ type: 'success', message: 'Atleta atualizado com sucesso!' });
    void Promise.resolve(onRefresh?.()).catch(() => {});
  };

  const handleDelete = async () => {
    if (!athleteToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gestor/athletes/${athleteToDelete.player.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || 'Falha ao remover atleta');
      setAthleteToDelete(null);
      await onRefresh?.();
      toast({ type: 'success', message: 'Atleta removido do elenco.' });
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Falha ao remover atleta') });
    } finally {
      setDeleting(false);
    }
  };

  return {
    editing, setEditing, athleteToDelete, setAthleteToDelete, deleting,
    linkData, setLinkData, handleGenerateLink, handleSimulateConsent, handleSave, handleDelete,
  };
}
