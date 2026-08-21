import type { Match } from './page';
import { LocateMatchesFilters, LocateMatchesResults } from './LocateMatchesView.sections';

type Status = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
type Props = { filteredMatches: Match[]; loading: boolean; searchTerm: string; filterStatus: Status; filterTournament: string; onSearch: (value: string) => void; onStatus: (value: Status) => void; onTournament: (value: string) => void; onBack: () => void; onOpen: (match: Match) => void; };

export function LocateMatchesView({ filteredMatches, loading, searchTerm, filterStatus, filterTournament, onSearch, onStatus, onTournament, onBack, onOpen }: Props) {
  return <div className="min-h-screen bg-gray-50"><header className="bg-white shadow-sm border-b sticky top-0 z-10"><div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4"><button onClick={onBack} className="text-sky-600 hover:text-sky-700 font-medium">← Voltar</button><h1 className="text-xl font-bold text-gray-900">Localizar Partidas</h1></div></header><main className="max-w-6xl mx-auto px-4 py-8"><LocateMatchesFilters searchTerm={searchTerm} filterStatus={filterStatus} filterTournament={filterTournament} onSearch={onSearch} onStatus={onStatus} onTournament={onTournament} /><LocateMatchesResults matches={filteredMatches} loading={loading} onOpen={onOpen} /></main></div>;
}
