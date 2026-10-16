import type { LocateFilterStatus } from './locate-matches.logic';

interface LocateMatchesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: LocateFilterStatus;
  onStatusChange: (value: LocateFilterStatus) => void;
  filterTournament: string;
  onTournamentChange: (value: string) => void;
}

export function LocateMatchesFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusChange,
  filterTournament,
  onTournamentChange,
}: LocateMatchesFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Busca */}
        <div>
          <label htmlFor="locate-search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input id="locate-search" type="text" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Jogador ou torneio..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="locate-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="locate-status" value={filterStatus} onChange={(e) => onStatusChange(e.target.value as LocateFilterStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="ALL">Todos</option>
            <option value="SCHEDULED">Agendadas</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="FINISHED">Finalizadas</option>
          </select>
        </div>

        {/* Torneio */}
        <div>
          <label htmlFor="locate-tournament" className="block text-sm font-medium text-gray-700 mb-1">Torneio</label>
          <select id="locate-tournament" value={filterTournament} onChange={(e) => onTournamentChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Todos</option>
            <option value="Copa Clube 2026">Copa Clube 2026</option>
            <option value="Torneio de Verão">Torneio de Verão</option>
            <option value="Campeonato Interno">Campeonato Interno</option>
          </select>
        </div>
      </div>
    </div>
  );
}
