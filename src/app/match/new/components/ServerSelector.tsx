'use client';

interface ServerSelectorProps {
  players: { p1: string; p2: string };
  server: 'PLAYER_1' | 'PLAYER_2';
  autoServer: 'PLAYER_1' | 'PLAYER_2' | null;
  onServerChange: (server: 'PLAYER_1' | 'PLAYER_2') => void;
}

export function ServerSelector({
  players,
  server,
  autoServer,
  onServerChange,
}: ServerSelectorProps) {
  if (autoServer) {
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
        <h4 className="text-xs font-semibold text-sky-800 mb-1">Saque identificado automaticamente</h4>
        <p className="text-sm text-sky-700">
          Sacando:{' '}
          <span className="font-bold">
            {autoServer === 'PLAYER_1' ? players.p1 : players.p2}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Quem está sacando?</h4>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onServerChange('PLAYER_1')}
          className={`flex-1 py-2.5 rounded-lg border-2 font-medium transition-all ${
            server === 'PLAYER_1'
              ? 'border-sky-500 bg-sky-50 text-sky-700'
              : 'border-gray-300 text-gray-600'
          }`}
        >
          {players.p1}
        </button>
        <button
          type="button"
          onClick={() => onServerChange('PLAYER_2')}
          className={`flex-1 py-2.5 rounded-lg border-2 font-medium transition-all ${
            server === 'PLAYER_2'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
              : 'border-gray-300 text-gray-600'
          }`}
        >
          {players.p2}
        </button>
      </div>
    </div>
  );
}