'use client';

import type { AthleteItem } from './types';
import type { AtletaFormData } from './editar-atleta-modal';
import { DeleteAthleteModal } from '@/components/athlete/delete-athlete-modal';
import { EditarAtletaModal } from './editar-atleta-modal';
import { LinkCopyModal } from './link-copy-modal';
import { normalizeDominance, normalizeGender } from '@/lib/athlete-labels.logic';

interface LinkData {
  open: boolean;
  name: string;
  token: string;
  expiresAt?: string;
}

interface AthletesTableModalsProps {
  editing: AthleteItem | null;
  onEditingChange: (athlete: AthleteItem | null) => void;
  onSave: (data: AtletaFormData) => Promise<void> | void;
  athleteToDelete: AthleteItem | null;
  onDeleteChange: (athlete: AthleteItem | null) => void;
  deleting: boolean;
  onConfirmDelete: () => void;
  linkData: LinkData;
  onLinkOpenChange: (open: boolean) => void;
}

/** Modais da aba Atletas do gestor: edição, remoção do elenco e link de senha. */
export function AthletesTableModals({
  editing, onEditingChange, onSave,
  athleteToDelete, onDeleteChange, deleting, onConfirmDelete,
  linkData, onLinkOpenChange,
}: AthletesTableModalsProps) {
  return (
    <>
      {editing && (
        <EditarAtletaModal
          open
          cpfRequired={Boolean(editing.player.user)}
          onOpenChange={(open) => { if (!open) onEditingChange(null); }}
          atleta={{
            id: editing.player.id, name: editing.player.name,
            cpf: editing.player.user?.cpf || editing.player.cpf || '',
            birthDate: editing.player.birthDate ? String(editing.player.birthDate) : '',
            gender: normalizeGender(editing.player.gender) ?? 'MALE',
            dominance: normalizeDominance(editing.player.dominance) ?? 'RIGHT',
            backhand: editing.player.backhand ?? '',
            rankings: editing.player.rankings ?? {},
          }}
          onSave={onSave}
        />
      )}

      {athleteToDelete && (
        <DeleteAthleteModal
          athleteName={athleteToDelete.player.name}
          deleting={deleting}
          onCancel={() => onDeleteChange(null)}
          onConfirm={onConfirmDelete}
          title="Remover do Elenco"
          description={(
            <>
              Tem certeza que deseja remover{' '}
              <span className="font-semibold text-telemetry-text-primary">{athleteToDelete.player.name}</span>{' '}
              do elenco do clube? O cadastro e a conta de acesso serão preservados.
            </>
          )}
        />
      )}

      <LinkCopyModal
        open={linkData.open}
        onOpenChange={onLinkOpenChange}
        title="Link de Redefinição de Senha"
        recipientName={linkData.name}
        token={linkData.token}
        expiresAt={linkData.expiresAt}
      />
    </>
  );
}
