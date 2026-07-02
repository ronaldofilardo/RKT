'use client';

interface ActionBarProps {
  secondServe: boolean;
  serveStep: 'none' | 'second';
  canUndo: boolean;
  canEdit: boolean;
  ballExchangeCount: number;
  fontScale: number;
  isFinished: boolean;
  onAce: () => void;
  onOut: (step: 'first' | 'second') => void;
  onNet: (step: 'first' | 'second') => void;
  onLet: () => void;
  onCancelSecondServe: () => void;
  onServeCancel: () => void;
  onUndo: () => void;
  onFontSmaller: () => void;
  onFontBigger: () => void;
  onEditScore: () => void;
  onBallExchange: () => void;
  onStats?: () => void;
}

export function ActionBar({
  secondServe, serveStep, canUndo, canEdit, ballExchangeCount, fontScale, isFinished,
  onAce, onOut, onNet, onLet, onCancelSecondServe, onServeCancel,
  onUndo, onFontSmaller, onFontBigger, onEditScore, onBallExchange, onStats,
}: ActionBarProps) {
  const serveDisabled = isFinished || ballExchangeCount > 0;
  const showSecondBadge = serveStep === 'second' || secondServe;

  return (
    <div className="bg-white border-t border-gray-200 p-4 space-y-3 safe-bottom">
      <div className="flex items-center gap-2 justify-center flex-wrap">
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${showSecondBadge ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {showSecondBadge ? '2º Saque' : '1º Saque'}
        </span>

        <button onClick={onAce} disabled={serveDisabled}
          className="px-3 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform">
          Ace
        </button>
        <button onClick={() => onOut(serveStep === 'second' ? 'second' : 'first')} disabled={serveDisabled}
          className="px-3 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform">
          Out
        </button>
        <button onClick={() => onNet(serveStep === 'second' ? 'second' : 'first')} disabled={serveDisabled}
          className="px-3 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform">
          Net
        </button>

        {showSecondBadge ? (
          <button onClick={onServeCancel}
            className="px-3 py-2.5 text-sm font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-transform">
            ✕
          </button>
        ) : (
          <button onClick={onLet} disabled={isFinished}
            className="px-3 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform">
            Let
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button onClick={onUndo} disabled={!canUndo || isFinished}
          className="flex items-center gap-1 px-3 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform">
          ↩ Correção
        </button>

        <button onClick={onFontSmaller} className="px-3 py-2.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-transform">
          A−
        </button>
        <span className="text-xs text-gray-500 w-8 text-center tabular-nums">{Math.round(fontScale * 100)}%</span>
        <button onClick={onFontBigger} className="px-3 py-2.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-transform">
          A+
        </button>

        {canEdit && (
          <button onClick={onEditScore} className="px-3 py-2.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-transform">
            ✏️
          </button>
        )}

        {onStats && (
          <button onClick={onStats} className="px-3 py-2.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-transform">
            📊
          </button>
        )}

        <div className="flex items-center gap-2">
          {ballExchangeCount > 0 && (
            <span className="text-xs font-semibold text-gray-700">BOLAS: {ballExchangeCount}</span>
          )}
          <button onClick={onBallExchange} className="px-3 py-2.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-95 transition-transform">
            +ball
          </button>
        </div>
      </div>
    </div>
  );
}
