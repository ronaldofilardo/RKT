import type { RankingType } from '@/lib/ranking/rankingConstants';
import { EditAthleteModalFields } from './EditAthleteModal.fields';
import type { AthleteFormState, RankingState, RankingsState } from './edit-athlete-modal.types';

interface Props {
  athleteName: string;
  form: AthleteFormState;
  rankings: RankingsState;
  age: number;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof AthleteFormState, value: string) => void;
  onRankingToggle: (type: RankingType) => void;
  onRankingFieldChange: (type: RankingType, field: keyof RankingState, value: string) => void;
}

export function EditAthleteModalView({ athleteName, form, rankings, age, saving, error, onClose, onSave, onFieldChange, onRankingToggle, onRankingFieldChange }: Props) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
    <div className="absolute inset-0 bg-black/50" onClick={onClose} role="button" tabIndex={-1} aria-label="Fechar modal" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
      <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50"><div><h2 className="text-base font-bold text-gray-900">Editar Atleta</h2><p className="text-xs text-gray-600">{athleteName}</p></div><button type="button" onClick={onClose} aria-label="Fechar" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg">×</button></header>
      {error && <div className="mx-4 mt-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      <EditAthleteModalFields form={form} rankings={rankings} age={age} saving={saving} onFieldChange={onFieldChange} onRankingToggle={onRankingToggle} onRankingFieldChange={onRankingFieldChange} />
      <footer className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex gap-3"><button type="button" onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancelar</button><button type="button" onClick={onSave} disabled={saving || !form.name.trim()} className="flex-1 px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar Alterações'}</button></footer>
    </div>
  </div>;
}
