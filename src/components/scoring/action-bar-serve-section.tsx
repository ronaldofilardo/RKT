import type { ReactNode } from 'react';

function ActionButton({
  onClick,
  disabled,
  variant = 'default',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'ace' | 'fault';
  children: ReactNode;
}) {
  const variantStyles =
    variant === 'ace'
      ? 'hover:border-telemetry-volt/60 active:shadow-telemetry-volt'
      : variant === 'fault'
      ? 'hover:border-telemetry-error/60'
      : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all select-none min-h-[48px] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed bg-telemetry-elevated hover:bg-telemetry-active text-telemetry-text-primary border border-white/10 ${variantStyles}`}
    >
      {children}
    </button>
  );
}

export function ServeSection({
  aceDetailsEnabled, onAceDetailsToggle, dfDetailsEnabled, onDfDetailsToggle,
  showSecondBadge, disabled, onAce, onOut, onNet, step, processing,
}: {
  aceDetailsEnabled: boolean; onAceDetailsToggle: () => void;
  dfDetailsEnabled: boolean; onDfDetailsToggle: () => void;
  showSecondBadge: boolean; disabled: boolean;
  onAce: () => void;
  onOut: (s: 'first' | 'second') => void;
  onNet: (s: 'first' | 'second') => void;
  step: 'none' | 'second'; processing?: boolean;
}) {
  const current = step === 'second' ? 'second' : 'first';
  return (
    <>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <span
          className={`flex-shrink-0 whitespace-nowrap text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full ${
            showSecondBadge
              ? 'bg-telemetry-alert text-telemetry-base shadow-sm'
              : 'bg-telemetry-blue text-white shadow-sm'
          }`}
        >
          {showSecondBadge ? '2º SAQUE' : '1º SAQUE'}
        </span>
        <label className="flex items-center gap-1 sm:gap-2 whitespace-nowrap text-[11px] sm:text-xs text-telemetry-text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={aceDetailsEnabled}
            onChange={onAceDetailsToggle}
            disabled={disabled}
            className="accent-telemetry-volt bg-telemetry-card cursor-pointer"
          />
          Detalhes do ACE
        </label>
        <label className="flex items-center gap-1 sm:gap-2 whitespace-nowrap text-[11px] sm:text-xs text-telemetry-text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dfDetailsEnabled}
            onChange={onDfDetailsToggle}
            disabled={disabled}
            className="accent-telemetry-volt bg-telemetry-card cursor-pointer"
          />
          Detalhes da DF
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ActionButton onClick={onAce} disabled={disabled} variant="ace">
          {processing ? '⏳' : 'Ace'}
        </ActionButton>
        <ActionButton onClick={() => onOut(current)} disabled={disabled} variant="fault">
          {processing ? '⏳' : 'Out'}
        </ActionButton>
        <ActionButton onClick={() => onNet(current)} disabled={disabled} variant="fault">
          {processing ? '⏳' : 'Net'}
        </ActionButton>
      </div>
    </>
  );
}
