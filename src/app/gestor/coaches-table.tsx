'use client';

import { useState } from 'react';
import type { CoachItem } from './types';
import { EditarTreinadorModal } from './editar-treinador-modal';
import { LinkCopyModal } from './link-copy-modal';
import { CoachRow } from './coach-row';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

interface CoachesTableProps {
  coaches: CoachItem[];
  selectedIds: string[];
  onSelectChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onCreate: () => void;
  onRefresh?: () => void;
}

export function CoachesTable({
  coaches, selectedIds, onSelectChange, onSelectAll, onCreate, onRefresh,
}: CoachesTableProps) {
  const [editing, setEditing] = useState<CoachItem | null>(null);
  const [linkData, setLinkData] = useState<{ open: boolean; name: string; token: string; expiresAt?: string }>({
    open: false, name: '', token: '',
  });
  const { toast } = useToast();

  const allSelected = coaches.length > 0 && coaches.every((c) => selectedIds.includes(c.user.id));

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
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Treinadores do Clube</h2>
        <button onClick={onCreate} className="bg-telemetry-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-telemetry-blue/90 text-sm">
          Cadastrar Treinador / Atleta
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/20 text-sm font-medium text-telemetry-text-muted">
              <th className="pb-3 w-10">
                <input id="treinadores-select-all" type="checkbox" aria-label="Selecionar todos" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} className="w-4 h-4 text-telemetry-blue rounded" />
              </th>
              <th className="pb-3">Nome</th><th className="pb-3">CPF</th><th className="pb-3">E-mail</th>
              <th className="pb-3">Ingresso</th><th className="pb-3">Status</th><th className="pb-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((c) => (
              <CoachRow key={c.user.id} coach={c} selected={selectedIds.includes(c.user.id)} onSelect={(chk) => onSelectChange(c.user.id, chk)} onEdit={() => setEditing(c)} onGenerateLink={() => handleGenerateLink(c)} />
            ))}
            {coaches.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-telemetry-text-muted text-sm">Nenhum treinador cadastrado no clube.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <EditarTreinadorModal
          open={Boolean(editing)}
          onOpenChange={(op) => !op && setEditing(null)}
          treinador={{ id: editing.user.id, name: editing.user.name, cpf: editing.user.cpf, email: editing.user.email, birthDate: '' }}
          onSave={handleSave}
        />
      )}
      <LinkCopyModal open={linkData.open} onOpenChange={(op) => setLinkData((prev) => ({ ...prev, open: op }))} title="Link de Redefinição de Senha" recipientName={linkData.name} token={linkData.token} expiresAt={linkData.expiresAt} />
    </div>
  );
}
