'use client';

import { useRouter } from 'next/navigation';
import type { AppRouteInput } from '@/lib/app-router';
import { getStatusColor, getStatusLabel } from './locate-matches.helpers';
import { useLocateMatches } from './use-locate-matches';
import { LocateMatchesFilters } from './locate-matches-filters';

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
                <div key={match.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(match.state)}`}>
                          {getStatusLabel(match.state)}
                        </span>
                        {match.tournamentName && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {match.tournamentName}
                          </span>
                        )}
                        {match.round && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {match.round}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{match.player1.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="font-semibold text-gray-900">{match.player2.name}</span>
                      </div>
                      {match.scheduledAt && (
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(match.scheduledAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {match.state === 'SCHEDULED' && (
                        <button onClick={() => router.push(`/match/${match.id}/scoring` as AppRouteInput)}
                          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors">
                          Anotar
                        </button>
                      )}
                      {match.state === 'IN_PROGRESS' && (
                        <button onClick={() => router.push(`/match/${match.id}` as AppRouteInput)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                          Ver Placar
                        </button>
                      )}
                      {match.state === 'FINISHED' && (
                        <button onClick={() => router.push(`/match/${match.id}/report`)}
                          className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
                          Relatório
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
