import { ServeButton } from './action-bar-serve-button';

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
  const faultVariant = current === 'second' ? 'double-fault' : 'fault';
  const faultSubLabel = current === 'second' ? 'Dupla falta' : undefined;
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4">
        <span
          className={`flex-shrink-0 whitespace-nowrap text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 rounded-full ${
            showSecondBadge
              ? 'bg-telemetry-alert text-telemetry-base shadow-sm'
              : 'bg-telemetry-blue text-white shadow-sm'
          }`}
        >
          {showSecondBadge ? '2º SAQUE' : '1º SAQUE'}
        </span>
        <label className="flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm text-telemetry-text-muted cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={aceDetailsEnabled}
            onChange={onAceDetailsToggle}
            disabled={disabled}
            className="h-4 w-4 accent-telemetry-volt bg-telemetry-card cursor-pointer"
          />
          Detalhes do ACE
        </label>
        <label className="flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm text-telemetry-text-muted cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={dfDetailsEnabled}
            onChange={onDfDetailsToggle}
            disabled={disabled}
            className="h-4 w-4 accent-telemetry-volt bg-telemetry-card cursor-pointer"
          />
          Detalhes da DF
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <ServeButton onClick={onAce} disabled={disabled} variant="ace" icon="⚡">
          {processing ? '⏳' : 'Ace'}
        </ServeButton>
        <ServeButton onClick={() => onOut(current)} disabled={disabled} variant={faultVariant} subLabel={faultSubLabel} icon="✕">
          {processing ? '⏳' : 'Out'}
        </ServeButton>
        <ServeButton
          onClick={() => onNet(current)}
          disabled={disabled}
          variant={current === 'second' ? 'double-fault' : 'net'}
          subLabel={faultSubLabel}
          icon="⌗"
        >
          {processing ? '⏳' : 'Net'}
        </ServeButton>
      </div>
    </>
  );
}
