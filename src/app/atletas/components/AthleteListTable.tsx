import { RANKING_TYPE_LABELS, RankingType } from '@/lib/ranking/rankingConstants';

interface RankingEntry {
  category?: string;
  class?: string;
  position: number;
  juvenilePosition?: number;
}

interface Athlete {
  id: string;
  name: string;
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
  dominance?: string | null;
  backhand?: string | null;
  ranking?: number | null;
  rankings?: Record<string, RankingEntry> | null;
}

interface AthleteListTableProps {
  athletes: Athlete[];
  onEditAthlete: (athlete: Athlete) => void;
  onDeleteAthlete: (athlete: Athlete) => void;
}

export function AthleteListTable({ athletes, onEditAthlete, onDeleteAthlete }: AthleteListTableProps) {
  const formatBirthDate = (bd: string | null | undefined) => {
    if (!bd) return null;
    const d = new Date(bd);
    return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCFullYear()}`;
  };

  const formatRankings = (rankings: Record<string, RankingEntry> | null | undefined) => {
    if (!rankings || Object.keys(rankings).length === 0) return null;
    return Object.entries(rankings).map(([type, entry]) => {
      const label = RANKING_TYPE_LABELS[type as RankingType] || type;
      let txt = `${label} #${entry.position}`;
      if (entry.category) txt += ` (${entry.category}`;
      if (entry.class) txt += ` ${entry.class}`;
      if (entry.category) txt += ')';
      if (entry.juvenilePosition) txt += ` · JJ #${entry.juvenilePosition}`;
      return txt;
    });
  };

  if (athletes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum atleta cadastrado</h3>
        <p className="text-gray-500">Cadastre atletas para começar a utilizar o sistema.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800">Atletas Cadastrados</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sexo</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nascimento</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Idade</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Dominância</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Backhand</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rankings</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {athletes.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{a.name}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    a.gender === 'MALE' ? 'bg-blue-100 text-blue-800' :
                    a.gender === 'FEMALE' ? 'bg-pink-100 text-pink-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {a.gender === 'MALE' ? 'M' : a.gender === 'FEMALE' ? 'F' : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatBirthDate(a.birthDate) || <span className="text-gray-400">-</span>}
                </td>
                <td className="px-6 py-4">
                  {a.age != null ? (
                    <span className="text-sm font-medium text-gray-900">{a.age} anos</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {a.dominance === 'RIGHT' ? 'Destro' : a.dominance === 'LEFT' ? 'Canhoto' : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {a.backhand === 'ONE_HANDED' ? '1 mão' : a.backhand === 'TWO_HANDED' ? '2 mãos' : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const rankingList = formatRankings(a.rankings);
                    if (!rankingList) return <span className="text-gray-400 text-sm">-</span>;
                    return (
                      <div className="flex flex-wrap gap-1">
                        {rankingList.map((r, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-medium border border-sky-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => onEditAthlete(a)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteAthlete(a)}
                      aria-label={`Excluir atleta ${a.name}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
