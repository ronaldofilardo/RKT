'use client';

import { useState } from 'react';
import type { AthleteItem } from './types';
import { EditarAtletaModal } from './editar-atleta-modal';
import { LinkCopyModal } from './link-copy-modal';
import { AthleteRow } from './athlete-row';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

interface AthletesTableProps {
  athletes: AthleteItem[];
  selectedIds: string[];
  onSelectChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onCreate: () => void;
  onRefresh?: () => void;
}

export function AthletesTable({
  athletes, selectedIds, onSelectChange, onSelectAll, onCreate, onRefresh,
}: AthletesTableProps) {
  const [editing, setEditing] = useState<AthleteItem | null>(null);
  const [linkData, setLinkData] = useState<{ open: boolean; name: string; token: string; expiresAt?: string }>({
    open: false, name: '', token: '',
  });
  const { toast } = useToast();

  const allSelected = athletes.length > 0 && athletes.every((a) => selectedIds.includes(a.player.id));

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Atletas do Clube</h2>
        <button onClick={onCreate} className="bg-telemetry-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-telemetry-blue/90 text-sm">
          Cadastrar Treinador / Atleta
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/20 text-sm font-medium text-telemetry-text-muted">
              <th className="pb-3 w-10">
                <input id="atletas-select-all" type="checkbox" aria-label="Selecionar todos" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} className="w-4 h-4 text-telemetry-blue rounded" />
              </th>
              <th className="pb-3">Nome</th><th className="pb-3">CPF</th><th className="pb-3">Gênero</th>
              <th className="pb-3">Lateralidade</th><th className="pb-3">Status</th><th className="pb-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a) => (
              <AthleteRow key={a.player.id} athlete={a} selected={selectedIds.includes(a.player.id)} onSelect={(chk) => onSelectChange(a.player.id, chk)} onEdit={() => setEditing(a)} onGenerateLink={() => handleGenerateLink(a)} />
            ))}
            {athletes.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-telemetry-text-muted text-sm">Nenhum atleta cadastrado no clube.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && (
        <EditarAtletaModal
          open={Boolean(editing)}
          onOpenChange={(op) => !op && setEditing(null)}
          atleta={{
            id: editing.player.id, name: editing.player.name,
            cpf: editing.player.user?.cpf || editing.player.cpf || '',
            birthDate: editing.player.birthDate ? String(editing.player.birthDate) : '',
            gender: editing.player.gender || 'MASCULINO', dominance: editing.player.dominance || 'DESTRO',
          }}
          onSave={handleSave}
        />
      )}
      <LinkCopyModal open={linkData.open} onOpenChange={(op) => setLinkData((prev) => ({ ...prev, open: op }))} title="Link de Redefinição de Senha" recipientName={linkData.name} token={linkData.token} expiresAt={linkData.expiresAt} />
    </div>
  );
}
