'use client';

import { CadastrarMembroConfirmModal, type MemberType, type CadastroResult } from './cadastrar-membro-confirm-modal';
import { CadastrarMembroForm } from './cadastrar-membro-form';
import { CadastrarMembroLinkPrompt } from './cadastrar-membro-link-prompt';
import { useCadastrarMembroModal } from './use-cadastrar-membro-modal';

interface CadastrarMembroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (result: CadastroResult) => void;
  initialType?: MemberType;
  fixedType?: MemberType;
}

export function CadastrarMembroModal({ open, onOpenChange, onSave, initialType = 'TREINADOR', fixedType }: CadastrarMembroModalProps) {
  const {
    submitting, error, fieldError, confirmResult, setConfirmResult,
    existingToLink, setExistingToLink, type, setType, formData, setFormData, submitMember,
  } = useCadastrarMembroModal(onSave, onOpenChange, initialType, fixedType);

  if (!open && !confirmResult) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-telemetry-card border border-telemetry-border/20 text-telemetry-text-primary rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-telemetry-text-primary">{type === 'TREINADOR' ? 'Novo Treinador' : 'Novo Atleta'}</h2>
              <button onClick={() => onOpenChange(false)} className="text-telemetry-text-muted hover:text-telemetry-text-primary">✕</button>
            </div>
            {error && <div className="mb-4 p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-sm rounded-lg">{error}</div>}
            {existingToLink ? (
              <CadastrarMembroLinkPrompt
                name={existingToLink.name} type={type} submitting={submitting}
                accountKind={existingToLink.accountKind} guardianName={existingToLink.guardianName}
                message={existingToLink.message} canLink={existingToLink.canLink}
                onCancel={() => setExistingToLink(null)} onConfirm={() => submitMember(true)}
              />
            ) : (
              <CadastrarMembroForm
                type={type} fixedType={fixedType} setType={setType} formData={formData} setFormData={setFormData}
                submitting={submitting} fieldError={fieldError} onCancel={() => onOpenChange(false)} onSubmit={(e) => { e.preventDefault(); submitMember(false); }}
              />
            )}
          </div>
        </div>
      )}
      <CadastrarMembroConfirmModal open={Boolean(confirmResult)} result={confirmResult} onClose={() => setConfirmResult(null)} />
    </>
  );
}
