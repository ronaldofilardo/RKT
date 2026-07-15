import type { TennisFormat } from '@/core/scoring/types';

interface SetInputFormProps {
  matchFormat: TennisFormat;
  totalEditedSets: number;
  playerNames: { p1: string; p2: string };
  p1Input: string;
  p2Input: string;
  p1Points: string;
  p2Points: string;
  tiebreakP1: string;
  tiebreakP2: string;
  floorCurrentSets: { player1: number; player2: number } | null;
  floorValidationError: string | null;
  isMatchTiebreakSet: boolean;
  hasTiebreak: boolean;
  isSetTrulyCompleted: boolean;
  tiebreakComplete: boolean;
  partial: boolean;
  p1Val: number;
  p2Val: number;
  validationError?: string;
  onP1InputChange: (value: string) => void;
  onP2InputChange: (value: string) => void;
  onP1PointsChange: (value: string) => void;
  onP2PointsChange: (value: string) => void;
  onTiebreakP1Change: (value: string) => void;
  onTiebreakP2Change: (value: string) => void;
  onAddSet?: () => void;
  canAddNextSet: boolean;
  matchAlreadyOver: boolean;
  matchWouldEnd: boolean;
  p1SetsWon: number;
  p2SetsWon: number;
  maxSets: number;
}

const GAME_POINTS = ['0', '15', '30', '40', 'AD'] as const;

export function SetInputForm({
  matchFormat,
  totalEditedSets,
  playerNames,
  p1Input,
  p2Input,
  p1Points,
  p2Points,
  tiebreakP1,
  tiebreakP2,
  floorCurrentSets,
  floorValidationError,
  isMatchTiebreakSet,
  hasTiebreak,
  isSetTrulyCompleted,
  tiebreakComplete,
  partial,
  p1Val,
  p2Val,
  validationError,
  onP1InputChange,
  onP2InputChange,
  onP1PointsChange,
  onP2PointsChange,
  onTiebreakP1Change,
  onTiebreakP2Change,
  onAddSet,
  canAddNextSet,
  matchAlreadyOver,
  matchWouldEnd,
  p1SetsWon,
  p2SetsWon,
  maxSets,
}: SetInputFormProps) {
  const isMatchOver = matchAlreadyOver || totalEditedSets >= maxSets;

  const getStatusMessage = () => {
    if (!p1Input && !p2Input) return null;

    const p1Num = parseInt(p1Input, 10);
    const p2Num = parseInt(p2Input, 10);
    const winner = p1Num > p2Num ? playerNames.p1 : playerNames.p2;

    if (isMatchTiebreakSet) {
      if (isSetTrulyCompleted) {
        return `${winner} venceu o match tiebreak — partida encerrada`;
      }
      return 'Match tiebreak em andamento — primeiro a 10 com diferença de 2';
    }

    if (isSetTrulyCompleted) {
      return `${winner} venceu o set`;
    }

    return `Set ${totalEditedSets + 1} em andamento — informe os games`;
  };

  return (
    <div className="space-y-3 rounded-lg bg-gray-750 border border-white/5 p-3">
      {isMatchTiebreakSet ? (
        <>
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
            Set {totalEditedSets + 1} — Match Tiebreak
          </p>
          <p className="text-xs text-gray-400 -mt-2 mb-1">
            Primeiro a 10 pontos com diferença de 2
          </p>
        </>
      ) : (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Set {totalEditedSets + 1}
        </p>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-16 truncate">
          {playerNames.p1}
        </span>
        <input
          type="number"
          className={`w-16 text-center bg-gray-700 border rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            p1Input && p2Input && p1Val > p2Val
              ? 'border-green-500/50'
              : 'border-white/10'
          }`}
          value={p1Input}
          onChange={(e) => onP1InputChange(e.target.value)}
          placeholder="0"
          autoFocus
          min={floorCurrentSets?.player1 ?? 0}
          max={isMatchTiebreakSet ? 20 : 50}
        />
        <span className="text-gray-500 text-xs">×</span>
        <input
          type="number"
          className={`w-16 text-center bg-gray-700 border rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            p1Input && p2Input && p2Val > p1Val
              ? 'border-green-500/50'
              : 'border-white/10'
          }`}
          value={p2Input}
          onChange={(e) => onP2InputChange(e.target.value)}
          placeholder="0"
          min={floorCurrentSets?.player2 ?? 0}
          max={isMatchTiebreakSet ? 20 : 50}
        />
        <span className="text-xs text-gray-400 w-16 truncate text-right">
          {playerNames.p2}
        </span>
      </div>

      {isMatchTiebreakSet && (
        <p className="text-xs text-gray-500 mt-1">
          {p1Input && p2Input && (p1Val >= 10 || p2Val >= 10) && Math.abs(p1Val - p2Val) >= 2
            ? p1Val > p2Val
              ? `${playerNames.p1} venceu o match tiebreak — partida encerrada`
              : `${playerNames.p2} venceu o match tiebreak — partida encerrada`
            : 'Primeiro a 10 pontos com diferença de 2'}
        </p>
      )}

      {isMatchTiebreakSet && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 mt-2">
          <p className="text-xs text-blue-300">
            ℹ️ Match Tie-Break usa pontos corridos (1, 2, 3...) — não há contagem tradicional de games (0, 15, 30, 40)
          </p>
        </div>
      )}

      {floorValidationError && (
        <p className="text-xs text-red-400">{floorValidationError}</p>
      )}

      {!isMatchTiebreakSet && hasTiebreak && p1Input && p2Input && ((p1Val === 6 && p2Val === 6) || (matchFormat === 'SHORT_SET_2V2_NO_AD' && p1Val === 4 && p2Val === 4)) && (
        <div className="space-y-1 pt-1">
          <p className="text-xs font-semibold text-gray-400">
            Tie-Break
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-16 truncate">
              {playerNames.p1}
            </span>
            <input
              type="number"
              className="w-16 text-center bg-gray-700 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tiebreakP1}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0) onTiebreakP1Change(String(v));
                else if (e.target.value === '') onTiebreakP1Change('');
              }}
              min={0}
              max={20}
              placeholder="0"
            />
            <span className="text-gray-500 text-xs">×</span>
            <input
              type="number"
              className="w-16 text-center bg-gray-700 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tiebreakP2}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0) onTiebreakP2Change(String(v));
                else if (e.target.value === '') onTiebreakP2Change('');
              }}
              min={0}
              max={20}
              placeholder="0"
            />
            <span className="text-xs text-gray-400 w-16 truncate text-right">
              {playerNames.p2}
            </span>
          </div>
          {!tiebreakComplete && (
            <p className="text-xs text-gray-500 mt-1">
              Informe o placar do tiebreak (ex.: 7x5).
            </p>
          )}
        </div>
      )}

      {hasTiebreak && p1Input && p2Input && isSetTrulyCompleted && !tiebreakComplete && (
        <p className="text-xs text-amber-400">
          Tiebreak necessário - informe os pontos para completar o set
        </p>
      )}

      {p1Input && p2Input && (
        <p
          className={`text-xs ${isSetTrulyCompleted ? 'text-green-400' : 'text-amber-400'}`}
        >
          {getStatusMessage()}
        </p>
      )}

      {isSetTrulyCompleted && matchWouldEnd && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-3 mt-2">
          <p className="text-sm font-semibold text-green-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Partida encerrada — confirmar para finalizar
          </p>
          <p className="text-xs text-green-400 mt-1">
            {p1Val > p2Val ? playerNames.p1 : playerNames.p2} venceu por {p1SetsWon}-{p2SetsWon} sets
          </p>
        </div>
      )}

      {partial && floorCurrentSets && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-2">
          <p className="text-xs text-amber-300">
            Ponto de parada: {floorCurrentSets.player1}x
            {floorCurrentSets.player2} — placar não pode ser inferior a
            este valor.
          </p>
        </div>
      )}

      {partial && (
        <div className="space-y-1 pt-1">
          <p className="text-xs font-semibold text-gray-400">
            Pontos no Game Atual
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-16 truncate">
              {playerNames.p1}
            </span>
            <select
              className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={p1Points}
              onChange={(e) => onP1PointsChange(e.target.value)}
              disabled={isMatchTiebreakSet}
            >
              {GAME_POINTS.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
              {p2Points === '40' && (
                <>
                  <option value="DEUCE">Deuce</option>
                  <option value="AD">Adv.</option>
                </>
              )}
            </select>
            <span className="text-gray-500 text-xs">×</span>
            <select
              className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              value={p2Points}
              onChange={(e) => onP2PointsChange(e.target.value)}
              disabled={isMatchTiebreakSet}
            >
              {GAME_POINTS.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
              {p1Points === '40' && (
                <>
                  <option value="DEUCE">Deuce</option>
                  <option value="AD">Adv.</option>
                </>
              )}
            </select>
            <span className="text-xs text-gray-400 w-16 truncate text-right">
              {playerNames.p2}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isMatchTiebreakSet
              ? 'Match Tie-Break usa pontos corridos — desativado'
              : 'Apenas para sets normais — Match Tie-Break usa pontos corridos'}
          </p>
        </div>
      )}

      {isMatchTiebreakSet ? null : (
        <button
          onClick={onAddSet}
          className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all"
          disabled={!canAddNextSet}
        >
          Adicionar Set {totalEditedSets + 2}
        </button>
      )}
    </div>
  );
}