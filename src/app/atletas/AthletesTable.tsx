'use client';

import { RANKING_TYPE_LABELS, RankingType } from '@/app/match/new/rankingConstants';
import type { Athlete, RankingEntry } from './useAtletasController';

function birthDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function rankings(value: Record<string, RankingEntry> | null | undefined) {
  if (!value || Object.keys(value).length === 0) return null;
  return Object.entries(value).map(([type, entry]) => {
    const label = RANKING_TYPE_LABELS[type as RankingType] || type;
    const category = entry.category ? ` (${entry.category}${entry.class ? ` ${entry.class}` : ''})` : '';
    const juvenile = entry.juvenilePosition ? ` · JJ #${entry.juvenilePosition}` : '';
    return `${label} #${entry.position}${category}${juvenile}`;
  });
}

function GenderCell({ value }: { value?: string | null }) {
  const label = value === 'MALE' ? 'M' : value === 'FEMALE' ? 'F' : '-';
  const color = value === 'MALE' ? 'bg-blue-100 text-blue-800' : value === 'FEMALE' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-600';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

function AthleteRow({ athlete, onEdit, onDelete }: { athlete: Athlete; onEdit: () => void; onDelete: () => void }) {
  const rankingList = rankings(athlete.rankings);
  return <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4"><div className="font-semibold text-gray-900">{athlete.name}</div></td>
    <td className="px-6 py-4"><GenderCell value={athlete.gender} /></td>
    <td className="px-6 py-4 text-sm text-gray-700">{birthDate(athlete.birthDate) || <span className="text-gray-400">-</span>}</td>
    <td className="px-6 py-4">{athlete.age != null ? <span className="text-sm font-medium text-gray-900">{athlete.age} anos</span> : <span className="text-gray-400">-</span>}</td>
    <td className="px-6 py-4 text-sm text-gray-700">{athlete.dominance === 'RIGHT' ? 'Destro' : athlete.dominance === 'LEFT' ? 'Canhoto' : '-'}</td>
    <td className="px-6 py-4 text-sm text-gray-700">{athlete.backhand === 'ONE_HANDED' ? '1 mão' : athlete.backhand === 'TWO_HANDED' ? '2 mãos' : '-'}</td>
    <td className="px-6 py-4">{rankingList ? <div className="flex flex-wrap gap-1">{rankingList.map((item) => <span key={item} className="inline-flex items-center px-2 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">{item}</span>)}</div> : <span className="text-gray-400 text-sm">-</span>}</td>
    <td className="px-6 py-4 text-right"><div className="inline-flex items-center gap-1"><button onClick={onEdit} className="px-3 py-1.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700">Editar</button><button onClick={onDelete} aria-label={`Excluir atleta ${athlete.name}`} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100">Excluir</button></div></td>
  </tr>;
}

export function AthletesTable({ athletes, onEdit, onDelete }: { athletes: Athlete[]; onEdit: (athlete: Athlete) => void; onDelete: (athlete: Athlete) => void }) {
  return <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"><div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h2 className="text-base font-semibold text-gray-800">Atletas Cadastrados</h2></div><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50">{['Nome', 'Sexo', 'Nascimento', 'Idade', 'Dominância', 'Backhand', 'Rankings', 'Ações'].map((header) => <th key={header} className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">{header}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{athletes.map((athlete) => <AthleteRow key={athlete.id} athlete={athlete} onEdit={() => onEdit(athlete)} onDelete={() => onDelete(athlete)} />)}</tbody></table></div></div>;
}
