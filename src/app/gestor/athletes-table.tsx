'use client';

import { useMemo } from 'react';
import type { AthleteItem } from './types';
import { EditarAtletaModal } from './editar-atleta-modal';
import { LinkCopyModal } from './link-copy-modal';
import { AthleteRow } from './athlete-row';
import { useAthletesTableHandlers } from './use-athletes-table';
import { normalizeDominance, normalizeGender } from '@/lib/athlete-labels.logic';

interface AthletesTableProps {
  athletes: AthleteItem[];
  selectedIds: string[];
  onSelectChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onCreateAthlete: () => void;
  onRefresh?: () => void;
}

export function AthletesTable({
  athletes, selectedIds, onSelectChange, onSelectAll, onCreateAthlete, onRefresh,
}: AthletesTableProps) {
  const {
    editing, setEditing, linkData, setLinkData,
    handleGenerateLink, handleSave,
  } = useAthletesTableHandlers({ onRefresh });

  const allSelected = useMemo(
    () => athletes.length > 0 && athletes.every((a) => selectedIds.includes(a.player.id)),
    [athletes, selectedIds],
  );

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Atletas do Clube</h2>
        <div className="flex gap-2">
          <button onClick={onCreateAthlete} className="bg-telemetry-volt text-black font-bold py-2 px-4 rounded-lg hover:bg-telemetry-volt/90 active:scale-95 transition-all text-sm">
            Novo Atleta
          </button>
        </div>
      </div>

      {athletes.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
          <p className="text-telemetry-text-muted text-sm">Nenhum atleta cadastrado no clube.</p>
        </div>
      ) : (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
                <th className="px-3 pb-4 pt-4 w-10">
                  <input id="atletas-select-all" type="checkbox" aria-label="Selecionar todos" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} className="w-4 h-4 text-telemetry-blue border-telemetry-border rounded" />
                </th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nome</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">CPF</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Gênero</th>
                <th className="px-3 pb-4 pt-4 text-sm font-bold text-telemetry-volt">Data de nascimento</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Idade</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Status</th>
                <th className="px-3 pb-4 pt-4 text-right text-sm font-medium text-telemetry-text-primary">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-telemetry-border/20">
              {athletes.map((a) => (
                <AthleteRow key={a.player.id} athlete={a} selected={selectedIds.includes(a.player.id)} onSelect={(chk) => onSelectChange(a.player.id, chk)} onEdit={() => setEditing(a)} onGenerateLink={() => handleGenerateLink(a)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <EditarAtletaModal
          open={Boolean(editing)}
          cpfRequired={Boolean(editing.player.user)}
          onOpenChange={(op) => !op && setEditing(null)}
          atleta={{
            id: editing.player.id, name: editing.player.name,
            cpf: editing.player.user?.cpf || editing.player.cpf || '',
            birthDate: editing.player.birthDate ? String(editing.player.birthDate) : '',
            gender: normalizeGender(editing.player.gender) ?? 'MALE', dominance: normalizeDominance(editing.player.dominance) ?? 'RIGHT',
          }}
          onSave={handleSave}
        />
      )}
      <LinkCopyModal open={linkData.open} onOpenChange={(op) => setLinkData((prev) => ({ ...prev, open: op }))} title="Link de Redefinição de Senha" recipientName={linkData.name} token={linkData.token} expiresAt={linkData.expiresAt} />
    </div>
  );
}
