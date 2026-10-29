'use client';

import { useState } from 'react';
import type { TrainingCenter } from '../suporte/types';

interface EditarClubeModalGestorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ct: TrainingCenter;
  onSave: (data: { name: string; slug: string; razaoSocial: string; telefone: string; email: string; legalRepName: string; legalRepEmail: string; legalRepPhone: string }) => void;
}

export function EditarClubeModalGestor({ open, onOpenChange, ct, onSave }: EditarClubeModalGestorProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setSubmitting(true);
    try { onSave(formData); setSubmitting(false); onOpenChange(false); } catch { setError('Erro ao salvar alterações'); setSubmitting(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-telemetry-card border border-telemetry-border/20 text-telemetry-text-primary rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4">
        <div className="flex justify-between items-start mb-6">
          <div><h2 className="text-xl font-bold text-telemetry-text-primary">Editar Meu Clube / CT</h2><p className="text-sm text-telemetry-text-muted">CNPJ: {ct.cnpj || '-'} (não editável)</p></div>
          <button onClick={() => onOpenChange(false)} className="text-telemetry-text-muted hover:text-telemetry-text-primary">✕</button>
        </div>
        {error && <div className="mb-4 p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3"><label htmlFor="clube-nome" className="text-sm font-medium text-telemetry-text-muted">Nome do CT</label><input id="clube-nome" type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
          <div className="grid grid-cols-1 gap-3">
            <div><label htmlFor="clube-slug" className="text-sm font-medium text-telemetry-text-muted">Slug</label><input id="clube-slug" type="text" value={formData.slug} onChange={(e) => handleChange('slug', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
            <div><label htmlFor="clube-razao-social" className="text-sm font-medium text-telemetry-text-muted">Razão Social</label><input id="clube-razao-social" type="text" value={formData.razaoSocial} onChange={(e) => handleChange('razaoSocial', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="clube-telefone" className="text-sm font-medium text-telemetry-text-muted">Telefone</label><input id="clube-telefone" type="tel" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
            <div><label htmlFor="clube-email" className="text-sm font-medium text-telemetry-text-muted">E-mail institucional</label><input id="clube-email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
          </div>
          <div className="space-y-3 pt-4 border-t border-telemetry-border/20">
            <span className="text-sm font-medium text-telemetry-text-muted">Representante Legal</span>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="clube-rep-nome" className="text-sm font-medium text-telemetry-text-muted">Nome completo</label><input id="clube-rep-nome" type="text" value={formData.legalRepName} onChange={(e) => handleChange('legalRepName', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
              <div><label htmlFor="clube-rep-email" className="text-sm font-medium text-telemetry-text-muted">E-mail</label><input id="clube-rep-email" type="email" value={formData.legalRepEmail} onChange={(e) => handleChange('legalRepEmail', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
            </div>
            <div><label htmlFor="clube-rep-telefone" className="text-sm font-medium text-telemetry-text-muted">Telefone</label><input id="clube-rep-telefone" type="tel" value={formData.legalRepPhone} onChange={(e) => handleChange('legalRepPhone', e.target.value)} className="w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none" /></div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-telemetry-text-muted hover:text-telemetry-text-primary mr-2 px-3 py-2">Cancelar</button>
            <button type="submit" disabled={submitting} className="bg-telemetry-blue text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-telemetry-blue/90 disabled:opacity-50 text-sm">{submitting ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
