import { useState } from 'react';
import type { AthleteItem } from './types';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

interface AthletesTableHandlersParams {
  onRefresh?: () => void | Promise<void>;
}

export function useAthletesTableHandlers({ onRefresh }: AthletesTableHandlersParams) {
  const [editing, setEditing] = useState<AthleteItem | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<AthleteItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [linkData, setLinkData] = useState<{ open: boolean; name: string; token: string; expiresAt?: string }>({
    open: false, name: '', token: '',
  });
  const { toast } = useToast();

  const handleGenerateLink = async (playerId: string, name: string) => {
    try {
      const res = await fetch(`/api/gestor/athletes/${playerId}/regenerate-link`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao gerar link');
      setLinkData({ open: true, name, token: data.token, expiresAt: data.expiresAt });
      await onRefresh?.();
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao gerar link') });
    }
  };

  const handleSave = async (data: {
    name: string;
    cpf?: string;
    birthDate?: string;
    gender?: string;
    dominance?: string;
    backhand?: string;
    rankings?: Record<string, any>;
  }) => {
    if (!editing) return;
    const res = await fetch(`/api/gestor/athletes/${editing.player.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error || 'Falha ao atualizar atleta');
    // Fecha o modal antes de aguardar o refresh: um refresh lento/pendurado
    // não pode manter o modal aberto após a gravação bem-sucedida.
    setEditing(null);
    toast({ type: 'success', message: 'Atleta atualizado com sucesso!' });
    void Promise.resolve(onRefresh?.()).catch(() => {});
  };

  /** Remove o atleta apenas do elenco do clube (cadastro e conta preservados). */
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
    editing,
    setEditing,
    athleteToDelete,
    setAthleteToDelete,
    deleting,
    linkData,
    setLinkData,
    handleGenerateLink,
    handleSave,
    handleDelete,
  };
}
