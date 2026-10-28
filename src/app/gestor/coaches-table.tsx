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
  onCreateCoach: () => void;
  onCreateAthlete: () => void;
  onRefresh?: () => void;
}

export function CoachesTable({
  coaches, selectedIds, onSelectChange, onSelectAll, onCreateCoach, onCreateAthlete, onRefresh,
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
    } catch (err) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao atualizar permissão de atletas' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Treinadores do Clube</h2>
        <div className="flex gap-2">
          <button onClick={onCreateCoach} className="bg-telemetry-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-telemetry-blue/90 text-sm">
            Novo Treinador
          </button>
          <button onClick={onCreateAthlete} className="bg-telemetry-volt text-white font-semibold py-2 px-4 rounded-lg hover:bg-telemetry-volt/90 text-sm">
            Novo Atleta
          </button>
        </div>
      </div>

      {coaches.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border opacity-20 p-8 text-center">
          <p className="text-telemetry-text-muted text-sm">Nenhum treinador cadastrado no clube.</p>
        </div>
      ) : (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border opacity-20 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border opacity-40 text-sm font-semibold text-telemetry-text-primary">
                <th className="pb-4 pt-4 w-10">
                  <input id="treinadores-select-all" type="checkbox" aria-label="Selecionar todos" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded" />
                </th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nome</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">CPF</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">E-mail</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Ingresso</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Status</th>
                <th className="pb-4 pt-4 text-center text-sm font-medium text-telemetry-text-primary">Inserir Atletas</th>
                <th className="pb-4 pt-4 text-right text-sm font-medium text-telemetry-text-primary">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-telemetry-border opacity-20">
              {coaches.map((c) => (
                <CoachRow key={c.user.id} coach={c} selected={selectedIds.includes(c.user.id)} onSelect={(chk) => onSelectChange(c.user.id, chk)} onEdit={() => setEditing(c)} onGenerateLink={() => handleGenerateLink(c)} onToggleCanInsertAthletes={(chk) => handleToggleCanInsertAthletes(c, chk)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
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
