'use client';

import { useEffect, useState } from 'react';
import type { UserItem } from './types';

interface EditarGestorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserItem;
  onSave: (data: { name: string; email: string; cpf: string; isActive: boolean; canOperate: boolean }) => void;
}

export function EditarGestorModal({ open, onOpenChange, user, onSave }: EditarGestorModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user.name, email: user.email, cpf: user.cpf,
    isActive: user.isActive, canOperate: user.canOperate,
  });

  useEffect(() => {
    setFormData({ name: user.name, email: user.email, cpf: user.cpf, isActive: user.isActive, canOperate: user.canOperate });
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setSubmitting(true);
    try {
      onSave(formData);
      setSubmitting(false);
      onOpenChange(false);
    } catch {
      setError('Erro ao salvar alterações');
      setFieldError(null);
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4">
        <div className="flex justify-between items-start mb-4">
          <div><h2 className="text-xl font-bold text-gray-900">Editar Gestor</h2><p className="text-xs text-gray-500">CPF: {user.cpf}</p></div>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gestor-nome" className="text-xs font-medium text-gray-700">Nome completo</label>
            <input id="gestor-nome" type="text" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'name' ? 'border-red-500' : ''}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gestor-email" className="text-xs font-medium text-gray-700">E-mail</label>
              <input id="gestor-email" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'email' ? 'border-red-500' : ''}`} />
            </div>
            <div>
              <label htmlFor="gestor-cpf" className="text-xs font-medium text-gray-700">CPF</label>
              <input id="gestor-cpf" type="text" value={formData.cpf} onChange={(e) => setFormData((p) => ({ ...p, cpf: e.target.value }))} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'cpf' ? 'border-red-500' : ''}`} />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t">
            <span className="text-xs font-medium text-gray-700">Permissões</span>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))} className="w-4 h-4 text-sky-600 rounded" />
              <label htmlFor="isActive" className="text-xs text-gray-700">Usuário ativo</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="canOperate" checked={formData.canOperate} onChange={() => setFormData((p) => ({ ...p, canOperate: !p.canOperate }))} className="w-4 h-4 text-sky-600 rounded" />
              <label htmlFor="canOperate" className="text-xs text-gray-700">Pode operar (anotar partidas)</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2">Cancelar</button>
            <button type="submit" disabled={submitting} className="bg-sky-700 text-white font-semibold py-2 px-5 rounded-lg hover:bg-sky-800 disabled:opacity-50 text-sm">{submitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
