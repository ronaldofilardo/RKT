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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-telemetry-card border border-telemetry-border/20 rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 text-telemetry-text-primary">
        <div className="flex justify-between items-start mb-6">
          <div><h2 className="text-xl font-bold text-telemetry-text-primary">Editar Clube / CT</h2><p className="text-sm text-telemetry-text-muted">CNPJ: {ct.cnpj || '-'} (não editável)</p></div>
          <button onClick={() => onOpenChange(false)} className="text-telemetry-text-muted hover:text-telemetry-text-primary">✕</button>
        </div>
        {error && <div className="mb-4 p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1"><label htmlFor="clube-suporte-nome" className="text-sm font-medium text-telemetry-text-secondary">Nome do CT</label><input id="clube-suporte-nome" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'name' ? 'border-telemetry-error' : ''}`} /></div>
          <div className="grid grid-cols-1 gap-3">
            <div><label htmlFor="clube-suporte-slug" className="text-sm font-medium text-telemetry-text-secondary">Slug</label><input id="clube-suporte-slug" type="text" value={formData.slug} onChange={(e) => handleChange('slug', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'slug' ? 'border-telemetry-error' : ''}`} /></div>
            <div><label htmlFor="clube-suporte-razao-social" className="text-sm font-medium text-telemetry-text-secondary">Razão Social</label><input id="clube-suporte-razao-social" type="text" value={formData.razaoSocial} onChange={(e) => handleChange('razaoSocial', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'razaoSocial' ? 'border-telemetry-error' : ''}`} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="clube-suporte-telefone" className="text-sm font-medium text-telemetry-text-secondary">Telefone</label><input id="clube-suporte-telefone" type="tel" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'telefone' ? 'border-telemetry-error' : ''}`} /></div>
            <div><label htmlFor="clube-suporte-email" className="text-sm font-medium text-telemetry-text-secondary">E-mail institucional</label><input id="clube-suporte-email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'email' ? 'border-telemetry-error' : ''}`} /></div>
          </div>
          <div className="space-y-3 pt-4 border-t border-telemetry-border/20">
            <span className="text-sm font-medium text-telemetry-text-secondary">Representante Legal</span>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="clube-suporte-rep-nome" className="text-sm font-medium text-telemetry-text-secondary">Nome completo</label><input id="clube-suporte-rep-nome" type="text" value={formData.legalRepName} onChange={(e) => handleChange('legalRepName', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'legalRepName' ? 'border-telemetry-error' : ''}`} /></div>
              <div><label htmlFor="clube-suporte-rep-email" className="text-sm font-medium text-telemetry-text-secondary">E-mail</label><input id="clube-suporte-rep-email" type="email" value={formData.legalRepEmail} onChange={(e) => handleChange('legalRepEmail', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'legalRepEmail' ? 'border-telemetry-error' : ''}`} /></div>
            </div>
            <div><label htmlFor="clube-suporte-rep-telefone" className="text-sm font-medium text-telemetry-text-secondary">Telefone</label><input id="clube-suporte-rep-telefone" type="tel" value={formData.legalRepPhone} onChange={(e) => handleChange('legalRepPhone', e.target.value)} className={`w-full bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-lg p-2.5 text-sm text-telemetry-text-primary ${fieldError === 'legalRepPhone' ? 'border-telemetry-error' : ''}`} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-telemetry-text-muted hover:text-telemetry-text-primary px-4 py-2">Cancelar</button>
            <button type="submit" disabled={submitting} className="bg-telemetry-blue hover:bg-telemetry-blue-light text-white font-semibold py-2.5 px-6 rounded-lg disabled:opacity-50">{submitting ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
