import { RankingForm } from './RankingForm';
import type { EditAthleteFieldsProps } from './edit-athlete-modal.types';

const inputClass = 'w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-gray-900 text-xs';

export function EditAthleteModalFields({ form, rankings, age, saving, onFieldChange, onRankingToggle, onRankingFieldChange }: EditAthleteFieldsProps) {
  const field = (name: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onFieldChange(name, e.target.value);
  return <div className="p-4 space-y-3 overflow-y-auto flex-1">
    <div><label htmlFor="edit-athlete-name" className="block text-xs font-medium text-gray-700 mb-0.5">Nome <span className="text-red-500">*</span></label><input id="edit-athlete-name" type="text" value={form.name} onChange={field('name')} disabled={saving} className={inputClass} /></div>
    <div className="grid grid-cols-4 gap-3"><div className="col-span-1"><label htmlFor="edit-athlete-gender" className="block text-xs font-medium text-gray-700 mb-0.5">Sexo</label><select id="edit-athlete-gender" value={form.gender} onChange={field('gender')} disabled={saving} className={inputClass}><option value="">Sel.</option><option value="MALE">M</option><option value="FEMALE">F</option></select></div><BirthDateFields form={form} saving={saving} onFieldChange={onFieldChange} /></div>
    <div className="grid grid-cols-2 gap-3"><SelectField id="edit-athlete-dominance" label="Dominância" value={form.dominance} onChange={field('dominance')} disabled={saving} options={['RIGHT|Destro', 'LEFT|Canhoto']} /><SelectField id="edit-athlete-backhand" label="Backhand" value={form.backhand} onChange={field('backhand')} disabled={saving} options={['ONE_HANDED|1 mão', 'TWO_HANDED|2 mãos']} /></div>
    <RankingForm form={form} rankings={rankings} age={age} saving={saving} onRankingToggle={onRankingToggle} onRankingFieldChange={onRankingFieldChange} />
  </div>;
}

function BirthDateFields({ form, saving, onFieldChange }: Pick<EditAthleteFieldsProps, 'form' | 'saving' | 'onFieldChange'>) {
  const fields: Array<[keyof typeof form, string, string, string, string]> = [['birthDay', 'edit-athlete-birthday', 'DD', '1', '31'], ['birthMonth', 'edit-athlete-birth-month', 'MM', '1', '12'], ['birthYear', 'edit-athlete-birth-year', 'AAAA', '1900', '2030']];
  return <div className="col-span-3"><label className="block text-xs font-medium text-gray-700 mb-0.5">Data de Nascimento</label><div className="flex items-center gap-1">{fields.map(([name, id, placeholder, min, max], index) => <span key={name} className="flex items-center gap-1">{index > 0 && <span className="text-gray-500 font-medium text-xs">/</span>}<input id={id} aria-label={placeholder} type="number" min={min} max={max} value={form[name]} onChange={(e) => onFieldChange(name, e.target.value)} disabled={saving} placeholder={placeholder} maxLength={placeholder === 'AAAA' ? 4 : 2} className={`${inputClass} ${placeholder === 'AAAA' ? 'w-16' : 'w-12'} text-center`} /></span>)}</div></div>;
}

function SelectField({ id, label, value, onChange, disabled, options }: { id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; disabled: boolean; options: string[] }) {
  return <div><label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-0.5">{label}</label><select id={id} value={value} onChange={onChange} disabled={disabled} className={inputClass}><option value="">Sel.</option>{options.map((option) => { const [optionValue, text] = option.split('|'); return <option key={optionValue} value={optionValue}>{text}</option>; })}</select></div>;
}
