'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  player1: { name: string };
  player2: { name: string };
  tournamentName?: string;
  round?: string;
  scheduledAt?: string;
  state: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
}

export default function LocateMatchesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED'>('ALL');
  const [filterTournament, setFilterTournament] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
  }, []);

  const filteredMatches = matches.filter(match => {
    const player1Name = match.player1?.name || '';
    const player2Name = match.player2?.name || '';
    const tournament = match.tournamentName || '';
    
    const matchesSearch = player1Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player2Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tournament.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || match.state === filterStatus;
    const matchesTournament = !filterTournament || tournament === filterTournament;
    return matchesSearch && matchesStatus && matchesTournament;
  });

  const getStatusColor = (status: Match['state']) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-700';
      case 'FINISHED': return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: Match['state']) => {
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
                        <button onClick={() => router.push(`/match/${match.id}/annotate` as any)}
                          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors">
                          Anotar
                        </button>
                      )}
                      {match.state === 'IN_PROGRESS' && (
                        <button onClick={() => router.push(`/match/${match.id}` as any)}
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