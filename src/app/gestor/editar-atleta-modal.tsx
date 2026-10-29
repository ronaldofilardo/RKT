'use client';
import { useState, useEffect } from 'react';

export interface AtletaFormData {
  name: string; cpf: string; birthDate: string; gender: string; dominance: string;
}
interface EditarAtletaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atleta?: { id: string } & AtletaFormData;
  onSave: (data: AtletaFormData) => Promise<void> | void;
}

export function EditarAtletaModal({ open, onOpenChange, atleta, onSave }: EditarAtletaModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AtletaFormData>({
    name: atleta?.name || '', cpf: atleta?.cpf || '',
    birthDate: atleta?.birthDate || '', gender: atleta?.gender || 'MASCULINO',
    dominance: atleta?.dominance || 'DESTRO',
  });
  useEffect(() => {
    if (atleta) {
      setFormData({
        name: atleta.name || '', cpf: atleta.cpf || '',
        birthDate: atleta.birthDate ? atleta.birthDate.slice(0, 10) : '',
        gender: atleta.gender || 'MASCULINO', dominance: atleta.dominance || 'DESTRO',
      });
    }
  }, [atleta]);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSave(formData);
      setSubmitting(false);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar atleta';
      const match = msg.match(/^([a-zA-Z]+):/);
      setFieldError(match ? match[1] : null);
      setError(msg);
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-telemetry-card border border-telemetry-border/20 text-telemetry-text-primary rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-telemetry-text-primary">{atleta ? 'Editar Atleta' : 'Novo Atleta'}</h2>
          <button onClick={() => onOpenChange(false)} className="text-telemetry-text-muted hover:text-telemetry-text-primary">✕</button>
        </div>
        {error && <div className="mb-4 p-3 bg-telemetry-error/10 border border-telemetry-error/30 text-telemetry-error text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editar-atleta-nome" className="text-xs font-medium text-telemetry-text-muted block mb-1">Nome completo</label>
            <input id="editar-atleta-nome" type="text" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className={`w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none ${fieldError === 'name' ? 'border-telemetry-error' : ''}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="editar-atleta-cpf" className="text-xs font-medium text-telemetry-text-muted block mb-1">CPF</label>
              <input id="editar-atleta-cpf" type="text" required value={formData.cpf} onChange={(e) => setFormData((p) => ({ ...p, cpf: e.target.value }))} className={`w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none ${fieldError === 'cpf' ? 'border-telemetry-error' : ''}`} />
            </div>
            <div>
              <label htmlFor="editar-atleta-nascimento" className="text-xs font-medium text-telemetry-text-muted block mb-1">Data de nascimento</label>
              <input id="editar-atleta-nascimento" type="date" required value={formData.birthDate} onChange={(e) => setFormData((p) => ({ ...p, birthDate: e.target.value }))} className={`w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none ${fieldError === 'birthDate' ? 'border-telemetry-error' : ''}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="editar-atleta-genero" className="text-xs font-medium text-telemetry-text-muted block mb-1">Gênero</label>
              <select id="editar-atleta-genero" value={formData.gender} onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))} className={`w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none ${fieldError === 'gender' ? 'border-telemetry-error' : ''}`}>
                <option value="MASCULINO">Masculino</option><option value="FEMININO">Feminino</option><option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label htmlFor="editar-atleta-lateralidade" className="text-xs font-medium text-telemetry-text-muted block mb-1">Lateralidade</label>
              <select id="editar-atleta-lateralidade" value={formData.dominance} onChange={(e) => setFormData((p) => ({ ...p, dominance: e.target.value }))} className={`w-full bg-telemetry-base border border-telemetry-border/30 text-telemetry-text-primary rounded-lg p-2.5 text-sm focus:border-telemetry-blue focus:outline-none ${fieldError === 'dominance' ? 'border-telemetry-error' : ''}`}>
                <option value="DESTRO">Destro</option><option value="CANHOTO">Canhoto</option><option value="AMBIDEXTRO">Ambidestro</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-telemetry-border/20">
            <button type="button" onClick={() => onOpenChange(false)} className="text-sm text-telemetry-text-muted hover:text-telemetry-text-primary px-3 py-2">Cancelar</button>
            <button type="submit" disabled={submitting} className="bg-telemetry-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-telemetry-blue/90 disabled:opacity-50 text-sm">{submitting ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
