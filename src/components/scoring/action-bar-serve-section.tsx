interface ServeSectionProps {
  aceDetailsEnabled: boolean;
  onAceDetailsToggle: () => void;
  dfDetailsEnabled: boolean;
  onDfDetailsToggle: () => void;
  showSecondBadge?: boolean;
  disabled: boolean;
}

const checkboxLabel =
  'flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-[11px] sm:text-xs text-telemetry-text-muted cursor-pointer select-none py-0.5';
const checkboxInput = 'h-3.5 w-3.5 sm:h-4 sm:w-4 accent-telemetry-volt bg-telemetry-card cursor-pointer rounded';

/**
 * Rodapé: opções de detalhe inline entre Voltar e ações secundárias.
 */
export function ServeSection({
  aceDetailsEnabled, onAceDetailsToggle, dfDetailsEnabled, onDfDetailsToggle, disabled,
}: ServeSectionProps) {
  return (
    <div className="flex items-center justify-center gap-x-2.5 sm:gap-x-4 flex-wrap">
      <label className={checkboxLabel}>
        <input type="checkbox" checked={aceDetailsEnabled} onChange={onAceDetailsToggle} disabled={disabled} className={checkboxInput} />
        <span>Detalhes do ACE</span>
      </label>
      <label className={checkboxLabel}>
        <input type="checkbox" checked={dfDetailsEnabled} onChange={onDfDetailsToggle} disabled={disabled} className={checkboxInput} />
        <span>Detalhes da DF</span>
      </label>
    </div>
  );
}
