'use client';

import { useState } from 'react';
import { CadastrarMembroConfirmModal, type MemberType, type CadastroResult } from './cadastrar-membro-confirm-modal';
import { CadastrarMembroForm, type MembroFormData } from './cadastrar-membro-form';

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
  const [type, setType] = useState<MemberType>(fixedType ?? initialType);
  const [formData, setFormData] = useState<MembroFormData>(initialForm);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    if (!formData.name.trim() || !formData.cpf.trim() || !formData.birthDate) {
      setError('Preencha Nome, CPF e Data de Nascimento.');
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
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha ao cadastrar membro');
      setConfirmResult({ userId: data.userId, tempPassword: data.tempPassword, linkExpiresAt: data.linkExpiresAt, type });
      setFormData(initialForm);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar membro';
      const match = msg.match(/^([a-zA-Z]+):/);
      setFieldError(match ? match[1] : null);
      setError(msg);
    } finally {
      setSubmitting(false);
      setFieldError(null);
    }
  }

  if (!open && !confirmResult) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">{type === 'TREINADOR' ? 'Novo Treinador' : 'Novo Atleta'}</h2>
              <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
            <CadastrarMembroForm type={type} fixedType={fixedType} setType={setType} formData={formData} setFormData={setFormData} submitting={submitting} fieldError={fieldError} onCancel={() => onOpenChange(false)} onSubmit={handleSubmit} />
          </div>
        </div>
      )}
      <CadastrarMembroConfirmModal open={Boolean(confirmResult)} result={confirmResult} onClose={() => { if (confirmResult) onSave(confirmResult); setConfirmResult(null); }} />
    </>
  );
}
