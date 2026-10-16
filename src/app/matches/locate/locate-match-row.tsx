import { getStatusColor, getStatusLabel, type Match } from './locate-matches.logic';

interface LocateMatchRowProps {
  match: Match;
  onNavigate: (path: string) => void;
}

export function LocateMatchRow({ match, onNavigate }: LocateMatchRowProps) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
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
            <button onClick={() => onNavigate(`/match/${match.id}/scoring`)}
              className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors">
              Anotar
            </button>
          )}
          {match.state === 'IN_PROGRESS' && (
            <button onClick={() => onNavigate(`/match/${match.id}`)}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
              Ver Placar
            </button>
          )}
          {match.state === 'FINISHED' && (
            <button onClick={() => onNavigate(`/match/${match.id}/report`)}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
              Relatório
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
