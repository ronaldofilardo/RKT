'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  player1: string;
  player2: string;
  tournament?: string;
  round?: string;
  scheduledAt?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
}

const MOCK_MATCHES: Match[] = [
  { id: '1', player1: 'João Silva', player2: 'Maria Santos', tournament: 'Copa Clube 2026', round: 'Oitavas', scheduledAt: '2026-06-22T10:00:00', status: 'SCHEDULED' },
  { id: '2', player1: 'Pedro Oliveira', player2: 'Ana Costa', tournament: 'Torneio de Verão', round: 'Quartas', scheduledAt: '2026-06-22T14:00:00', status: 'IN_PROGRESS' },
  { id: '3', player1: 'Carlos Mendes', player2: 'Lucas Ferreira', tournament: 'Campeonato Interno', round: 'Semifinal', scheduledAt: '2026-06-21T16:00:00', status: 'FINISHED' },
];

export default function LocateMatchesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED'>('ALL');
  const [filterTournament, setFilterTournament] = useState('');

  const filteredMatches = MOCK_MATCHES.filter(match => {
    const matchesSearch = match.player1.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.player2.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          match.tournament?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || match.status === filterStatus;
    const matchesTournament = !filterTournament || match.tournament === filterTournament;
    return matchesSearch && matchesStatus && matchesTournament;
  });

  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-700';
      case 'FINISHED': return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: Match['status']) => {
    switch (status) {
      case 'SCHEDULED': return 'Agendada';
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'FINISHED': return 'Finalizada';
    }
  };

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
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Jogador ou torneio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="ALL">Todos</option>
                <option value="SCHEDULED">Agendadas</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="FINISHED">Finalizadas</option>
              </select>
            </div>

            {/* Torneio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Torneio</label>
              <select value={filterTournament} onChange={(e) => setFilterTournament(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">Todos</option>
                <option value="Copa Clube 2026">Copa Clube 2026</option>
                <option value="Torneio de Verão">Torneio de Verão</option>
                <option value="Campeonato Interno">Campeonato Interno</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Partidas Encontradas</h2>
            <span className="text-sm text-gray-500">{filteredMatches.length} resultado(s)</span>
          </div>

          {filteredMatches.length > 0 ? (
            <div className="divide-y">
              {filteredMatches.map(match => (
                <div key={match.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(match.status)}`}>
                          {getStatusLabel(match.status)}
                        </span>
                        {match.tournament && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {match.tournament}
                          </span>
                        )}
                        {match.round && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {match.round}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{match.player1}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="font-semibold text-gray-900">{match.player2}</span>
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
                      {match.status === 'SCHEDULED' && (
                        <button onClick={() => router.push(`/match/${match.id}/annotate` as any)}
                          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors">
                          Anotar
                        </button>
                      )}
                      {match.status === 'IN_PROGRESS' && (
                        <button onClick={() => router.push(`/match/${match.id}` as any)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                          Ver Placar
                        </button>
                      )}
                      {match.status === 'FINISHED' && (
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