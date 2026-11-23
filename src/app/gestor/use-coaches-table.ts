import { useState } from 'react';
import type { CoachItem } from './types';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

export function useCoachesTableHandlers({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  const [editing, setEditing] = useState<CoachItem | null>(null);
  const [linkData, setLinkData] = useState<{ open: boolean; name: string; token: string; expiresAt?: string }>({ open: false, name: '', token: '' });
  const { toast } = useToast();

  const handleGenerateLink = async (c: CoachItem) => {
    try {
      const res = await fetch(`/api/gestor/coaches/${c.user.id}/regenerate-link`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao gerar link');
      setLinkData({ open: true, name: c.user.name, token: data.token, expiresAt: data.expiresAt });
      onRefresh?.();
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao gerar link') });
    }
  };

  const handleSave = async (data: { name: string; cpf: string; birthDate: string; email: string }) => {
    if (!editing) return;
    const res = await fetch(`/api/gestor/coaches/${editing.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || result.error || 'Falha ao atualizar treinador');
    onRefresh?.();
    toast({ type: 'success', message: 'Treinador atualizado com sucesso!' });
  };

  const handleToggleCanInsertAthletes = async (c: CoachItem, checked: boolean) => {
    try {
      const res = await fetch(`/api/gestor/coaches/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canInsertAthletes: checked }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Falha ao atualizar permissão');
      }
      onRefresh?.();
      toast({ type: 'info', message: checked ? 'Permissão ativada' : 'Permissão desativada' });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao atualizar permissão de atletas' });
    }
  };

  const [coachToDelete, setCoachToDelete] = useState<CoachItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!coachToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gestor/coaches/${coachToDelete.user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao excluir treinador');
      }
      setCoachToDelete(null);
      onRefresh?.();
      toast({ type: 'success', message: 'Treinador excluído com sucesso!' });
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao excluir treinador' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = (c: CoachItem) => {
    setCoachToDelete(c);
  };

  return {
    editing,
    setEditing,
    linkData,
    setLinkData,
    coachToDelete,
    setCoachToDelete,
    deleting,
    confirmDelete,
    handleGenerateLink,
    handleSave,
    handleToggleCanInsertAthletes,
    handleDelete,
  };
}
