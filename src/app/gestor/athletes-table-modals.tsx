'use client';

import type { AthleteItem } from './types';
import type { AtletaFormData } from './editar-atleta-modal';
import type { AthleteLinkModalState } from './athletes-link-modal.types';
import { DeleteAthleteModal } from '@/components/athlete/delete-athlete-modal';
import { EditarAtletaModal } from './editar-atleta-modal';
import { LinkCopyModal } from './link-copy-modal';
import { AthletesMinorLinksModal } from './athletes-minor-links-modal';
import { toAtletaFormData } from './athlete-modal-adapter';

interface AthletesTableModalsProps {
  editing: AthleteItem | null;
  onEditingChange: (athlete: AthleteItem | null) => void;
  viewing?: AthleteItem | null;
  onViewingChange?: (athlete: AthleteItem | null) => void;
  onSave: (data: AtletaFormData) => Promise<void> | void;
  athleteToDelete: AthleteItem | null;
  onDeleteChange: (athlete: AthleteItem | null) => void;
  deleting: boolean;
  onConfirmDelete: () => void;
  linkData: AthleteLinkModalState;
  onLinkOpenChange: (open: boolean) => void;
}

export function AthletesTableModals({
  editing, onEditingChange, viewing, onViewingChange, onSave,
  athleteToDelete, onDeleteChange, deleting, onConfirmDelete,
  linkData, onLinkOpenChange,
}: AthletesTableModalsProps) {
  const isMinorDoubleLink = Boolean(linkData.isMinor && linkData.guardianNoticeToken);

  return (
    <>
      {editing && (
        <EditarAtletaModal
          open
          cpfRequired={Boolean(editing.player.user)}
          guardianImmutable={Boolean(editing.player.isConsented)}
          onOpenChange={(open) => { if (!open) onEditingChange(null); }}
          atleta={toAtletaFormData(editing)}
          onSave={onSave}
        />
      )}

      {viewing && (
        <EditarAtletaModal
          open
          readOnly
          guardianImmutable
          onOpenChange={(open) => { if (!open) onViewingChange?.(null); }}
          atleta={toAtletaFormData(viewing)}
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
            <>Tem certeza que deseja remover <span className="font-semibold text-telemetry-text-primary">{athleteToDelete.player.name}</span> do elenco do clube? O cadastro e a conta serão preservados.</>
          )}
        />
      )}

      {isMinorDoubleLink ? (
        <AthletesMinorLinksModal
          open={linkData.open}
          onOpenChange={onLinkOpenChange}
          minorName={linkData.name}
          token={linkData.token}
          guardianNoticeToken={linkData.guardianNoticeToken!}
          guardianName={linkData.guardianName}
          expiresAt={linkData.expiresAt}
          isConsented={linkData.isConsented}
          mode={linkData.mode}
        />
      ) : (
        <LinkCopyModal
          open={linkData.open}
          onOpenChange={onLinkOpenChange}
          title="Link de Redefinição de Senha"
          recipientName={linkData.name}
          token={linkData.token}
          expiresAt={linkData.expiresAt}
        />
      )}
    </>
  );
}
