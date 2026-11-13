'use client';

import { useMemo } from 'react';
import type { AthleteItem } from './types';
import type { AthleteTableRowData } from '@/components/athlete/athlete-table.types';
import { AthleteTable } from '@/components/athlete/athlete-table';
import { AthletesTableModals } from './athletes-table-modals';
import { toAthleteTableRow } from './athlete-row-data';
import { useAthletesTableHandlers } from './use-athletes-table';

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
    editing, setEditing, athleteToDelete, setAthleteToDelete, deleting,
    linkData, setLinkData, handleGenerateLink, handleSave, handleDelete,
  } = useAthletesTableHandlers({ onRefresh });

  const rows = useMemo(() => athletes.map(toAthleteTableRow), [athletes]);
  const itemById = useMemo(() => new Map(athletes.map((a) => [a.player.id, a])), [athletes]);

  const actions = (row: AthleteTableRowData) => {
    const item = itemById.get(row.id);
    return {
      onEdit: () => { if (item) setEditing(item); },
      onDelete: () => { if (item) setAthleteToDelete(item); },
      onGenerateLink: () => { void handleGenerateLink(row.id, row.name); },
      canDelete: true,
      hasAccount: Boolean(item?.player.user),
    };
  };

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Atletas do Clube</h2>
        <button onClick={onCreateAthlete} className="bg-telemetry-volt text-black font-bold py-2 px-4 rounded-lg hover:bg-telemetry-volt/90 active:scale-95 transition-all text-sm">
          Novo Atleta
        </button>
      </div>

      {athletes.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
          <p className="text-telemetry-text-muted text-sm">Nenhum atleta cadastrado no clube.</p>
        </div>
      ) : (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20">
          <AthleteTable
            athletes={rows}
            actions={actions}
            selectable
            selectedIds={selectedIds}
            onSelectChange={onSelectChange}
            onSelectAll={onSelectAll}
          />
        </div>
      )}

      <AthletesTableModals
        editing={editing}
        onEditingChange={setEditing}
        onSave={handleSave}
        athleteToDelete={athleteToDelete}
        onDeleteChange={setAthleteToDelete}
        deleting={deleting}
        onConfirmDelete={handleDelete}
        linkData={linkData}
        onLinkOpenChange={(open) => setLinkData((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
