'use client';

interface TiebreakEditorProps {
  type: 'normal' | 'match';
  players: { p1: string; p2: string };
  p1Value: string;
  p2Value: string;
  pointsToWin: number;
  onP1Change: (value: string) => void;
  onP2Change: (value: string) => void;
  onError: () => void;
}

export function TiebreakEditor({
  type,
  players,
  p1Value,
  p2Value,
  pointsToWin,
  onP1Change,
  onP2Change,
  onError,
}: TiebreakEditorProps) {
  const isMatch = type === 'match';
  const borderColor = isMatch ? 'border-emerald-200' : 'border-sky-200';
  const bgColor = isMatch ? 'bg-emerald-50' : 'bg-sky-50';
  const labelColor = isMatch ? 'text-emerald-800' : 'text-sky-800';
  const inputBorderColor = isMatch ? 'border-emerald-300' : 'border-sky-300';
  const inputFocusRing = isMatch ? 'focus:ring-emerald-500' : 'focus:ring-sky-500';

  const labelP1Color = isMatch ? 'text-emerald-700' : 'text-sky-700';
  const labelP2Color = isMatch ? 'text-emerald-700' : 'text-sky-700';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-3`}>
      <h4 className={`text-xs font-semibold ${labelColor} mb-1`}>
        {isMatch ? 'Match Tie-break' : 'Tie-break em andamento'} (primeiro a {pointsToWin})
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-xs ${labelP1Color} mb-1`}>{players.p1}</label>
          <input
            type="number"
            min="0"
            value={p1Value}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onP1Change('');
                onError();
                return;
              }
              const num = parseInt(raw, 10);
              if (!isNaN(num) && num >= 0) {
                onP1Change(raw);
                onError();
              }
            }}
            placeholder="0"
            className={`w-full px-3 py-2 border-2 ${inputBorderColor} rounded-lg focus:outline-none focus:ring-2 ${inputFocusRing} text-base`}
          />
        </div>
        <div>
          <label className={`block text-xs ${labelP2Color} mb-1`}>{players.p2}</label>
          <input
            type="number"
            min="0"
            value={p2Value}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                onP2Change('');
                onError();
                return;
              }
              const num = parseInt(raw, 10);
              if (!isNaN(num) && num >= 0) {
                onP2Change(raw);
                onError();
              }
            }}
            placeholder="0"
            className={`w-full px-3 py-2 border-2 ${inputBorderColor} rounded-lg focus:outline-none focus:ring-2 ${inputFocusRing} text-base`}
          />
        </div>
      </div>
    </div>
  );
}

interface TiebreakPointsDisplayProps {
  players: { p1: string; p2: string };
  tiebreakPoints: { player1: number; player2: number };
  rules: { tiebreakPoints: number };
  setResult: { winner: 'PLAYER_1' | 'PLAYER_2'; isTiebreak: boolean } | null;
  currentSetNum: number;
  p1GNum: number;
  p2GNum: number;
  p1Sets: number;
  p2Sets: number;
  setsToWin: number;
  onConfirmSet: () => void;
}

export function TiebreakPointsDisplay({
  players,
  tiebreakPoints,
  rules,
  setResult,
  currentSetNum,
  p1GNum,
  p2GNum,
  p1Sets,
  p2Sets,
  setsToWin,
  onConfirmSet,
}: TiebreakPointsDisplayProps) {
  const winner = setResult?.winner;
  const canConfirmNext = winner &&
    p1Sets + (winner === 'PLAYER_1' ? 1 : 0) < setsToWin &&
    p2Sets + (winner === 'PLAYER_2' ? 1 : 0) < setsToWin;

  return (
    <div className="bg-green-50 border border-green-300 rounded-xl p-3 space-y-2">
      <p className="text-sm font-semibold text-green-800">
        Set {currentSetNum} completo:{' '}
        {winner === 'PLAYER_1' ? players.p1 : winner === 'PLAYER_2' ? players.p2 : '???'} vence{' '}
        <span className="font-bold">{p1GNum} × {p2GNum}</span>
        {setResult?.isTiebreak && (
          <span className="text-green-700 text-xs ml-1">
            (TB {tiebreakPoints.player1}-{tiebreakPoints.player2})
          </span>
        )}
      </p>
      {canConfirmNext && (
        <button
          type="button"
          onClick={onConfirmSet}
          className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
        >
          Confirmar Set {currentSetNum} e inserir próximo →
        </button>
      )}
    </div>
  );
}