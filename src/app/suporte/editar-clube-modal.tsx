'use client';

import { useState } from 'react';
import type { TrainingCenter } from './types';

interface EditarClubeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ct: TrainingCenter;
  onSave: (data: { name: string; slug: string; razaoSocial: string; telefone: string; email: string; legalRepName: string; legalRepEmail: string; legalRepPhone: string }) => void;
}

export function EditarClubeModal({ open, onOpenChange, ct, onSave }: EditarClubeModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: ct.name,
    slug: ct.slug,
    razaoSocial: ct.legalName || '',
    telefone: ct.phone || '',
    email: ct.email || '',
    legalRepName: ct.legalRepName || '',
    legalRepEmail: ct.legalRepEmail || '',
    legalRepPhone: ct.legalRepPhone || '',
  });

  const handleChange = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);
    setSubmitting(true);
    try { onSave(formData); setSubmitting(false); onOpenChange(false); } catch {
      const msg = 'Erro ao salvar alterações';
      setFieldError(null);
      setError(msg);
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4">
        <div className="flex justify-between items-start mb-6">
          <div><h2 className="text-xl font-bold text-gray-900">Editar Clube / CT</h2><p className="text-sm text-gray-500">CNPJ: {ct.cnpj || '-'} (não editável)</p></div>
          <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3"><label htmlFor="clube-suporte-nome" className="text-sm font-medium text-gray-700">Nome do CT</label><input id="clube-suporte-nome" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'name' ? 'border-red-500' : ''}`} /></div>
          <div className="grid grid-cols-1 gap-3">
            <div><label htmlFor="clube-suporte-slug" className="text-sm font-medium text-gray-700">Slug</label><input id="clube-suporte-slug" type="text" value={formData.slug} onChange={(e) => handleChange('slug', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'slug' ? 'border-red-500' : ''}`} /></div>
            <div><label htmlFor="clube-suporte-razao-social" className="text-sm font-medium text-gray-700">Razão Social</label><input id="clube-suporte-razao-social" type="text" value={formData.razaoSocial} onChange={(e) => handleChange('razaoSocial', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'razaoSocial' ? 'border-red-500' : ''}`} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="clube-suporte-telefone" className="text-sm font-medium text-gray-700">Telefone</label><input id="clube-suporte-telefone" type="tel" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'telefone' ? 'border-red-500' : ''}`} /></div>
            <div><label htmlFor="clube-suporte-email" className="text-sm font-medium text-gray-700">E-mail institucional</label><input id="clube-suporte-email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'email' ? 'border-red-500' : ''}`} /></div>
          </div>
          <div className="space-y-3 pt-4 border-t">
            <span className="text-sm font-medium text-gray-700">Representante Legal</span>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="clube-suporte-rep-nome" className="text-sm font-medium text-gray-700">Nome completo</label><input id="clube-suporte-rep-nome" type="text" value={formData.legalRepName} onChange={(e) => handleChange('legalRepName', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'legalRepName' ? 'border-red-500' : ''}`} /></div>
              <div><label htmlFor="clube-suporte-rep-email" className="text-sm font-medium text-gray-700">E-mail</label><input id="clube-suporte-rep-email" type="email" value={formData.legalRepEmail} onChange={(e) => handleChange('legalRepEmail', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'legalRepEmail' ? 'border-red-500' : ''}`} /></div>
            </div>
            <div><label htmlFor="clube-suporte-rep-telefone" className="text-sm font-medium text-gray-700">Telefone</label><input id="clube-suporte-rep-telefone" type="tel" value={formData.legalRepPhone} onChange={(e) => handleChange('legalRepPhone', e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm ${fieldError === 'legalRepPhone' ? 'border-red-500' : ''}`} /></div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-gray-600 hover:text-gray-800 mr-2">Cancelar</button>
            <button type="submit" disabled={submitting} className="bg-sky-700 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-sky-800 disabled:opacity-50">{submitting ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
