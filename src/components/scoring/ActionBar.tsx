'use client';

interface ActionBarProps {
  secondServe: boolean;
  serveStep: 'none' | 'second';
  canUndo: boolean;
  canEdit: boolean;
  fontScale: number;
  isFinished: boolean;
  isProcessing?: boolean;
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
  onStats?: () => void;
}

function ActionButton({ onClick, disabled, children, variant = 'default', className = '' }: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'secondary' | 'outline';
  className?: string;
}) {
  const base = 'flex items-center justify-center gap-1 px-2 sm:px-3 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all select-none min-h-[44px] sm:min-h-[48px] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    default: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400',
    secondary: 'bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:text-gray-400',
    outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function ActionBar({
  secondServe, serveStep, canUndo, canEdit, fontScale, isFinished, isProcessing,
  onAce, onOut, onNet, onLet, onCancelSecondServe, onServeCancel,
  onUndo, onFontSmaller, onFontBigger, onEditScore, onStats,
}: ActionBarProps) {
  const serveDisabled = isFinished || isProcessing;
  const showSecondBadge = serveStep === 'second' || secondServe;

  return (
    <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 safe-bottom dark:bg-slate-900 dark:border-slate-700">
      <div className="max-w-lg mx-auto space-y-3">
        <div className="flex items-center justify-center gap-1.5">
          <span className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full ${
            showSecondBadge ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {showSecondBadge ? '2º SAQUE' : '1º SAQUE'}
          </span>
          {showSecondBadge && (
            <button onClick={onServeCancel}
              className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-transform min-h-[32px]">
              Cancelar 2º
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <ActionButton onClick={onAce} disabled={serveDisabled}>
            {isProcessing ? '⏳' : 'Ace'}
          </ActionButton>
          <ActionButton onClick={() => onOut(serveStep === 'second' ? 'second' : 'first')} disabled={serveDisabled}>
            {isProcessing ? '⏳' : 'Out'}
          </ActionButton>
          <ActionButton onClick={() => onNet(serveStep === 'second' ? 'second' : 'first')} disabled={serveDisabled}>
            {isProcessing ? '⏳' : 'Net'}
          </ActionButton>
          <ActionButton onClick={showSecondBadge ? onServeCancel : onLet} disabled={isFinished || serveDisabled} variant={showSecondBadge ? 'danger' : 'default'}>
            {showSecondBadge ? '✕' : 'Let'}
          </ActionButton>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button onClick={onUndo} disabled={!canUndo || isFinished || isProcessing}
            className="flex items-center gap-1 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">
            {isProcessing ? '⏳' : '↩'} Corrigir
          </button>

          <div className="flex items-center gap-1.5">
            <button onClick={onFontSmaller} className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[36px] dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">
              A−
            </button>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 w-8 text-center tabular-nums font-medium">{Math.round(fontScale * 100)}%</span>
            <button onClick={onFontBigger} className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[36px] dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">
              A+
            </button>
          </div>

          {canEdit && (
            <button onClick={onEditScore} className="px-3 sm:px-4 py-3 text-xs sm:text-sm rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[44px] dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">
              ✏️
            </button>
          )}

          {onStats && (
            <button onClick={onStats} className="px-3 sm:px-4 py-3 text-xs sm:text-sm rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.97] transition-all min-h-[44px] dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">
              📊
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
