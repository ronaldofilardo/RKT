export interface Match {
  id: string;
  player1: { name: string };
  player2: { name: string };
  tournamentName?: string;
  round?: string;
  scheduledAt?: string;
  state: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
}

export type LocateFilterStatus = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';

export function filterMatches(
  matches: Match[],
  searchTerm: string,
  filterStatus: LocateFilterStatus,
  filterTournament: string,
): Match[] {
  return matches.filter(match => {
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
}

export const getStatusColor = (status: Match['state']) => {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
    case 'IN_PROGRESS': return 'bg-green-100 text-green-700';
    case 'FINISHED': return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusLabel = (status: Match['state']) => {
  switch (status) {
    case 'SCHEDULED': return 'Agendada';
    case 'IN_PROGRESS': return 'Em Andamento';
    case 'FINISHED': return 'Finalizada';
  }
};
