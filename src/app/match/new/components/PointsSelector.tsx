'use client';

const GAME_POINTS = ['0', '15', '30', '40', 'AD'] as const;

interface PointsSelectorProps {
  players: { p1: string; p2: string };
  p1Points: string;
  p2Points: string;
  onP1Change: (value: string) => void;
  onP2Change: (value: string) => void;
  onError: () => void;
}

export function PointsSelector({
  players,
  p1Points,
  p2Points,
  onP1Change,
  onP2Change,
  onError,
}: PointsSelectorProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">Pontos no Game Atual</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">{players.p1}</label>
          <select
            value={p1Points}
            onChange={(e) => {
              onP1Change(e.target.value);
              onError();
            }}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white"
          >
            {GAME_POINTS.map((pt) => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">{players.p2}</label>
          <select
            value={p2Points}
            onChange={(e) => {
              onP2Change(e.target.value);
              onError();
            }}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-base bg-white"
          >
            {GAME_POINTS.map((pt) => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}