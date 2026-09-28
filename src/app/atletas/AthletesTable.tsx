'use client';

import { RANKING_TYPE_LABELS, RankingType } from '@/lib/ranking/rankingConstants';
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
  const color = value === 'MALE' ? 'bg-blue-100 text-blue-800' : value === 'FEMALE' ? 'bg-pink-100 text-pink-800' : 'bg-white/5 text-telemetry-text-muted';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

function AthleteRow({ athlete, onEdit, onDelete }: { athlete: Athlete; onEdit: () => void; onDelete: () => void }) {
  const rankingList = rankings(athlete.rankings);
  return <tr className="hover:bg-white/5 transition-colors">
    <td className="px-6 py-4"><div className="font-semibold text-telemetry-text-primary">{athlete.name}</div></td>
    <td className="px-6 py-4"><GenderCell value={athlete.gender} /></td>
    <td className="px-6 py-4 text-sm text-telemetry-text-primary">{birthDate(athlete.birthDate) || <span className="text-telemetry-text-muted">-</span>}</td>
    <td className="px-6 py-4">{athlete.age != null ? <span className="text-sm font-medium text-telemetry-text-primary">{athlete.age} anos</span> : <span className="text-telemetry-text-muted">-</span>}</td>
    <td className="px-6 py-4 text-sm text-telemetry-text-primary">{athlete.dominance === 'RIGHT' ? 'Destro' : athlete.dominance === 'LEFT' ? 'Canhoto' : '-'}</td>
    <td className="px-6 py-4 text-sm text-telemetry-text-primary">{athlete.backhand === 'ONE_HANDED' ? '1 mão' : athlete.backhand === 'TWO_HANDED' ? '2 mãos' : '-'}</td>
    <td className="px-6 py-4">{rankingList ? <div className="flex flex-wrap gap-1">{rankingList.map((item) => <span key={item} className="inline-flex items-center px-2 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">{item}</span>)}</div> : <span className="text-telemetry-text-muted text-sm">-</span>}</td>
    <td className="px-6 py-4 text-right"><div className="inline-flex items-center gap-1"><button onClick={onEdit} className="px-3 py-1.5 bg-telemetry-active text-white text-sm font-medium rounded-lg hover:bg-sky-700">Editar</button><button onClick={onDelete} aria-label={`Excluir atleta ${athlete.name}`} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100">Excluir</button></div></td>
  </tr>;
}

export function AthletesTable({ athletes, onEdit, onDelete }: { athletes: Athlete[]; onEdit: (athlete: Athlete) => void; onDelete: (athlete: Athlete) => void }) {
  return <div className="bg-telemetry-elevated rounded-xl shadow-sm border border-white/10 overflow-hidden"><div className="px-6 py-4 border-b border-white/10 bg-white/5"><h2 className="text-base font-semibold text-telemetry-text-primary">Atletas Cadastrados</h2></div><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-white/10 bg-white/5">{['Nome', 'Sexo', 'Nascimento', 'Idade', 'Dominância', 'Backhand', 'Rankings', 'Ações'].map((header) => <th key={header} className="text-left px-6 py-3 text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">{header}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{athletes.map((athlete) => <AthleteRow key={athlete.id} athlete={athlete} onEdit={() => onEdit(athlete)} onDelete={() => onDelete(athlete)} />)}</tbody></table></div></div>;
}
