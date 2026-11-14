'use client';

import { useState } from 'react';
import type { EditAthleteModalProps } from './edit-athlete-modal.types';
import { useEditAthleteModal } from './use-edit-athlete-modal';
import { EditAthleteModalFooter } from './edit-athlete-modal-footer';
import { AthleteEditTabs, type AthleteEditTab } from './components/AthleteEditTabs';
import { EditAthletePersonalTab } from './components/EditAthletePersonalTab';
import { EditAthleteTechnicalTab } from './components/EditAthleteTechnicalTab';

export type { EditAthleteSavePayload } from './edit-athlete-modal.types';

export function EditAthleteModal({
  athlete, isOpen, title, saveLabel, readOnly, showCpf, cpfRequired, onClose, onSave,
}: EditAthleteModalProps) {
  const [activeTab, setActiveTab] = useState<AthleteEditTab>('pessoais');
  const {
    form, setForm, rankings, age, saving, error,
    toggleRankingEntry, updateRankingField, saveEditedAthlete,
  } = useEditAthleteModal({ athlete, isOpen, onSave });

  if (!isOpen) return null;
  const isLocked = saving || Boolean(readOnly);
  const modalTitle = readOnly ? 'Ficha do Atleta' : (title ?? (athlete ? 'Editar Atleta' : 'Novo Atleta'));
  const modalSubtitle = athlete?.name || 'Preencha os dados pessoais e técnicos';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} role="button" tabIndex={-1} aria-label="Fechar modal" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }} />
      <div role="dialog" aria-modal="true" aria-labelledby="edit-athlete-title" className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-telemetry-elevated">
          <div>
            <h2 id="edit-athlete-title" className="text-base font-bold text-telemetry-text-primary">
              {modalTitle}
            </h2>
            <p className="text-xs text-telemetry-text-muted">{modalSubtitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar modal" className="p-2 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <AthleteEditTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {error && <div role="alert" className="p-2 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert rounded-lg text-sm">{error}</div>}

          <div id="panel-dados-pessoais" role="tabpanel" aria-labelledby="tab-dados-pessoais" className={activeTab === 'pessoais' ? 'block' : 'hidden'}>
            <EditAthletePersonalTab form={form} setForm={setForm} saving={isLocked} age={age} showCpf={showCpf} cpfRequired={cpfRequired} />
          </div>

          <div id="panel-dados-tecnicos" role="tabpanel" aria-labelledby="tab-dados-tecnicos" className={activeTab === 'tecnicos' ? 'block' : 'hidden'}>
            <EditAthleteTechnicalTab form={form} setForm={setForm} rankings={rankings} age={age} saving={isLocked} onRankingToggle={toggleRankingEntry} onRankingFieldChange={updateRankingField} />
          </div>
        </div>

        <EditAthleteModalFooter saving={saving} canSave={Boolean(form.name.trim())} readOnly={readOnly} saveLabel={saveLabel ?? (athlete ? 'Salvar Alterações' : 'Salvar Atleta')} onClose={onClose} onSave={saveEditedAthlete} />
      </div>
    </div>
  );
}
