'use client';

import { useState } from 'react';
import { CadastrarMembroConfirmModal, type MemberType, type CadastroResult } from './cadastrar-membro-confirm-modal';
import { CadastrarMembroForm, type MembroFormData } from './cadastrar-membro-form';
import { CadastrarMembroLinkPrompt } from './cadastrar-membro-link-prompt';

interface CadastrarMembroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (result: CadastroResult) => void;
  initialType?: MemberType;
  fixedType?: MemberType;
}

const initialForm: MembroFormData = {
  name: '', cpf: '', birthDate: '', email: '', gender: 'MASCULINO', dominance: 'DESTRO',
};

export function CadastrarMembroModal({ open, onOpenChange, onSave, initialType = 'TREINADOR', fixedType }: CadastrarMembroModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmResult, setConfirmResult] = useState<CadastroResult | null>(null);
  const [existingToLink, setExistingToLink] = useState<{ name: string } | null>(null);
  const [type, setType] = useState<MemberType>(fixedType ?? initialType);
  const [formData, setFormData] = useState<MembroFormData>(initialForm);

  async function submitMember(linkExisting = false) {
    setError(null);
    setFieldError(null);
    if (!formData.name.trim() || !formData.cpf.trim() || !formData.birthDate) {
      setError('Nome, CPF e data de nascimento são obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = type === 'TREINADOR' ? '/api/gestor/coaches' : '/api/gestor/athletes';
      const body: any = { name: formData.name.trim(), cpf: formData.cpf, birthDate: formData.birthDate };
      if (type === 'TREINADOR') {
        body.email = formData.email;
      } else {
        body.email = formData.email || undefined;
        body.gender = formData.gender;
        body.laterality = formData.dominance;
      }
      // Conta já existente no RKT (treinador ou atleta): vincula em vez de duplicar cadastro.
      if (linkExisting) body.linkExisting = true;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.canLinkExisting) {
          setExistingToLink({ name: data.existingUserName || formData.name });
          return;
        }
        throw new Error(data.message || 'Falha ao cadastrar membro');
      }
      const result = { userId: data.userId, tempPassword: data.tempPassword, linkExpiresAt: data.linkExpiresAt, type, isExistingUser: data.isExistingUser };
      setConfirmResult(result);
      onSave(result);
      setFormData(initialForm);
      setExistingToLink(null);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.';
      const match = msg.match(/^([a-zA-Z]+):/);
      setFieldError(match ? match[1] : null);
      setError(msg);
    } finally { setSubmitting(false); }
  }

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
              <CadastrarMembroLinkPrompt name={existingToLink.name} type={type} submitting={submitting} onCancel={() => setExistingToLink(null)} onConfirm={() => submitMember(true)} />
            ) : (
              <CadastrarMembroForm type={type} fixedType={fixedType} setType={setType} formData={formData} setFormData={setFormData} submitting={submitting} fieldError={fieldError} onCancel={() => onOpenChange(false)} onSubmit={(e) => { e.preventDefault(); submitMember(false); }} />
            )}
          </div>
        </div>
      )}
      <CadastrarMembroConfirmModal open={Boolean(confirmResult)} result={confirmResult} onClose={() => setConfirmResult(null)} />
    </>
  );
}
