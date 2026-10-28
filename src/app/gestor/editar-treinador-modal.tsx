'use client';

import { useState, useEffect } from 'react';

interface EditarTreinadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treinador?: {
    id: string;
    name: string;
    cpf: string;
    email: string;
    birthDate: string;
  };
  onSave: (data: { name: string; cpf: string; birthDate: string; email: string }) => Promise<void> | void;
}

export function EditarTreinadorModal({ open, onOpenChange, treinador, onSave }: EditarTreinadorModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: treinador?.name || '',
    cpf: treinador?.cpf || '',
    birthDate: treinador?.birthDate || '',
    email: treinador?.email || '',
  });

  useEffect(() => {
    if (treinador) {
      setFormData({
        name: treinador.name || '',
        cpf: treinador.cpf || '',
        birthDate: treinador.birthDate ? treinador.birthDate.slice(0, 10) : '',
        email: treinador.email || '',
      });
    }
  }, [treinador]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSave(formData);
      setSubmitting(false);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar treinador';
      const match = msg.match(/^([a-zA-Z]+):/);
      setFieldError(match ? match[1] : null);
      setError(msg);
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">{treinador ? 'Editar Treinador' : 'Novo Treinador'}</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editar-treinador-nome" className="text-xs font-medium text-gray-700">Nome completo</label>
            <input id="editar-treinador-nome" type="text" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'name' ? 'border-red-500' : ''}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="editar-treinador-cpf" className="text-xs font-medium text-gray-700">CPF</label>
              <input id="editar-treinador-cpf" type="text" required value={formData.cpf} onChange={(e) => setFormData((p) => ({ ...p, cpf: e.target.value }))} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'cpf' ? 'border-red-500' : ''}`} />
            </div>
            <div>
              <label htmlFor="editar-treinador-nascimento" className="text-xs font-medium text-gray-700">Data de nascimento</label>
              <input id="editar-treinador-nascimento" type="date" required value={formData.birthDate} onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'birthDate' ? 'border-red-500' : ''}`} />
            </div>
          </div>
          <div>
            <label htmlFor="editar-treinador-email" className="text-xs font-medium text-gray-700">E-mail</label>
            <input id="editar-treinador-email" type="email" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'email' ? 'border-red-500' : ''}`} />
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
