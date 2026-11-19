interface ServeSectionProps {
  aceDetailsEnabled: boolean;
  onAceDetailsToggle: () => void;
  dfDetailsEnabled: boolean;
  onDfDetailsToggle: () => void;
  showSecondBadge?: boolean;
  disabled: boolean;
}

const checkboxLabel =
  'flex items-center gap-1 whitespace-nowrap text-[10px] sm:text-[11px] font-semibold text-telemetry-text-primary cursor-pointer select-none py-0';
const checkboxInput = 'h-3 w-3 sm:h-3.5 sm:w-3.5 accent-telemetry-volt bg-telemetry-card cursor-pointer rounded';

/**
 * Rodapé: opções de detalhe inline entre Voltar e ações secundárias.
 */
export function ServeSection({
  aceDetailsEnabled, onAceDetailsToggle, dfDetailsEnabled, onDfDetailsToggle, disabled,
}: ServeSectionProps) {
  return (
    <div className="flex items-center justify-center gap-x-2 sm:gap-x-3 flex-wrap">
      <span className="text-[10px] sm:text-[11px] font-medium text-telemetry-text-muted select-none">
        Detalhes
      </span>
      <label className={checkboxLabel}>
        <input
          type="checkbox"
          aria-label="Detalhes do ACE"
          checked={aceDetailsEnabled}
          onChange={onAceDetailsToggle}
          disabled={disabled}
          className={checkboxInput}
        />
        <span>ACE</span>
      </label>
      <label className={checkboxLabel}>
        <input
          type="checkbox"
          aria-label="Detalhes da DF"
          checked={dfDetailsEnabled}
          onChange={onDfDetailsToggle}
          disabled={disabled}
          className={checkboxInput}
        />
        <span>DF</span>
      </label>
    </div>
  );
}
