'use client';

import { useRouter } from 'next/navigation';
import type { AppRouteInput } from '@/lib/app-router';
import { useLocateMatches } from './use-locate-matches';
import { LocateMatchesFilters } from './locate-matches-filters';
import { LocateMatchRow } from './locate-match-row';

export default function LocateMatchesPage() {
  const router = useRouter();
  const {
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterTournament, setFilterTournament,
    filteredMatches, loading,
  } = useLocateMatches();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="text-sky-600 hover:text-sky-700 font-medium">← Voltar</button>
          <h1 className="text-xl font-bold text-gray-900">Localizar Partidas</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <LocateMatchesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterTournament={filterTournament}
          onTournamentChange={setFilterTournament}
        />

        {/* Resultados */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Partidas Encontradas</h2>
            <span className="text-sm text-gray-500">{filteredMatches.length} resultado(s)</span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Carregando...</h3>
              <p className="text-gray-500">Buscando partidas no banco de dados.</p>
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="divide-y">
              {filteredMatches.map(match => (
                <LocateMatchRow
                  key={match.id}
                  match={match}
                  onNavigate={(path) => router.push(path as AppRouteInput)}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma partida encontrada</h3>
              <p className="text-gray-500">Tente ajustar os filtros ou buscar por outros termos.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
