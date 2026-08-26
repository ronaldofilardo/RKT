import { RANKING_TYPE_LABELS, RankingType, hasCategories, hasClasses, getAllowedCategoriesForAge, getClassesForSelection, isYouthCategory, calculateAgeFromYear } from '@/app/match/new/rankingConstants';

export interface RankingState { enabled: boolean; category: string; class: string; position: string; juvenilePosition: string; }
type FieldKey = Exclude<keyof RankingState, 'enabled'>;
type Props = { type: RankingType; ranking: RankingState; age: number | null; birthYear?: number; gender: string; saving: boolean; onToggle: () => void; onChange: (field: FieldKey, value: string) => void };
type InputProps = { label: string; value: string; onChange: (value: string) => void; saving: boolean; id: string; placeholder: string };

function Header({ type, enabled, saving, onToggle }: { type: RankingType; enabled: boolean; saving: boolean; onToggle: () => void }) {
  return <div className="flex items-center gap-1.5 mb-1.5"><input type="checkbox" id={`ranking-${type}`} checked={enabled} onChange={onToggle} disabled={saving} className="w-3.5 h-3.5" /><label htmlFor={`ranking-${type}`} className="text-xs font-medium text-gray-700">{RANKING_TYPE_LABELS[type]}</label>{enabled && <button type="button" title="Remover este ranking" onClick={onToggle} disabled={saving} className="ml-auto text-xs text-red-500">Remover</button>}</div>;
}

function InputField({ label, value, onChange, saving, id, placeholder }: InputProps) {
  return <div><label htmlFor={id} className="block text-xs text-gray-500 mb-0.5">{label}</label><input id={id} type="number" min="1" value={value} onChange={e => onChange(e.target.value)} disabled={saving} placeholder={placeholder} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" /></div>;
}

function SelectField({ type, label, value, options, saving, onChange }: { type: string; label: string; value: string; options: string[]; saving: boolean; onChange: (value: string) => void }) {
  const isCategory = label === 'Categoria';
  return <div><label htmlFor={`ranking-${type}-${label.toLowerCase()}`} className="block text-xs text-gray-500 mb-0.5">{label}</label><select id={`ranking-${type}-${label.toLowerCase()}`} value={value} onChange={e => onChange(e.target.value)} disabled={saving} className="w-full px-2 py-1 border rounded text-xs"><option value="">Selecione...</option>{options.map(option => <option key={option} value={option}>{isCategory ? `${option} anos` : option}</option>)}</select></div>;
}

function RankingFields({ type, ranking, age, birthYear, gender, saving, onChange }: Props) {
  const categoryAge = age === null ? null : (birthYear && birthYear > 0 ? calculateAgeFromYear(birthYear) : age);
  const categories = categoryAge === null ? [] : getAllowedCategoriesForAge(type, categoryAge);
  const showCategory = hasCategories(type) && categoryAge !== null && categories.length > 0;
  const showClass = hasClasses(type) && ranking.enabled && Boolean(gender) && categoryAge !== null && categoryAge >= 11;
  const showYouthPosition = showClass && isYouthCategory(ranking.category);
  const classes = categoryAge !== null && gender ? getClassesForSelection(ranking.category, gender, categoryAge) : [];
  const position = <InputField label="Posição" value={ranking.position} onChange={value => onChange('position', value)} saving={saving} id={`ranking-${type}-position`} placeholder="Posição" />;
  return <div className="space-y-1.5">{showCategory && <div className="grid grid-cols-2 gap-2 items-end"><SelectField type={type} label="Categoria" value={ranking.category} options={categories} saving={saving} onChange={value => onChange('category', value)} />{position}</div>}{showClass && <div className="grid grid-cols-2 gap-2 items-end"><SelectField type={type} label="Classe" value={ranking.class} options={classes} saving={saving} onChange={value => onChange('class', value)} />{!showCategory && position}</div>}{showYouthPosition && <InputField label="Posição Ranking Juvenil" value={ranking.juvenilePosition} onChange={value => onChange('juvenilePosition', value)} saving={saving} id={`ranking-${type}-juvenile-position`} placeholder="Posição no ranking juvenil" />}{!showCategory && !showClass && position}</div>;
}

export function RankingFormItem(p: Props) {
  return <div className="border border-gray-200 rounded-md px-2.5 py-2"><Header type={p.type} enabled={p.ranking.enabled} saving={p.saving} onToggle={p.onToggle} />{p.ranking.enabled && <div className="ml-5"><RankingFields {...p} /></div>}</div>;
}
