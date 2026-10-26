interface ServeSectionProps {
  aceDetailsEnabled: boolean;
  onAceDetailsToggle: () => void;
  dfDetailsEnabled: boolean;
  onDfDetailsToggle: () => void;
  showSecondBadge?: boolean;
  disabled: boolean;
}

const checkboxLabel =
  'flex items-center gap-1 sm:gap-2 whitespace-nowrap text-xs sm:text-sm text-telemetry-text-muted cursor-pointer select-none py-1';
const checkboxInput = 'h-4 w-4 accent-telemetry-volt bg-telemetry-card cursor-pointer';

/**
 * Rodapé: opções de detalhe. O selo do 2º saque fica inline sob o card do sacador.
 */
export function ServeSection({
  aceDetailsEnabled, onAceDetailsToggle, dfDetailsEnabled, onDfDetailsToggle, disabled,
}: ServeSectionProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4">
      <label className={checkboxLabel}>
        <input type="checkbox" checked={aceDetailsEnabled} onChange={onAceDetailsToggle} disabled={disabled} className={checkboxInput} />
        Detalhes do ACE
      </label>
      <label className={checkboxLabel}>
        <input type="checkbox" checked={dfDetailsEnabled} onChange={onDfDetailsToggle} disabled={disabled} className={checkboxInput} />
        Detalhes da DF
      </label>
    </div>
  );
}
