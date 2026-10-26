import { ServeButton } from './action-bar-serve-button';
import type { ServeAction, ServeStepName } from './serve-inline.types';

interface ServeActionButtonsProps {
  step: ServeStepName;
  disabled: boolean;
  processing: boolean;
  openAction: ServeAction | null;
  onAction: (action: ServeAction) => void;
}

/** Ace / Out / Net logo abaixo do card do sacador; altura adaptativa (dvh). */
export function ServeActionButtons({ step, disabled, processing, openAction, onAction }: ServeActionButtonsProps) {
  const second = step === 'second';
  const faultVariant = second ? 'double-fault' : 'fault';
  const subLabel = second ? 'Dupla falta' : undefined;
  const label = (text: string) => (processing ? '⏳' : text);
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-1.5 flex-shrink-0">
      <ServeButton onClick={() => onAction('ace')} disabled={disabled} variant="ace" icon="⚡" active={openAction === 'ace'}>
        {label('Ace')}
      </ServeButton>
      <ServeButton onClick={() => onAction('out')} disabled={disabled} variant={faultVariant} subLabel={subLabel} icon="✕" active={openAction === 'out'}>
        {label('Out')}
      </ServeButton>
      <ServeButton onClick={() => onAction('net')} disabled={disabled} variant={second ? 'double-fault' : 'net'} subLabel={subLabel} icon="⌗" active={openAction === 'net'}>
        {label('Net')}
      </ServeButton>
    </div>
  );
}
