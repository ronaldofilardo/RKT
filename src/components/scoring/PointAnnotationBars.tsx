'use client';

import { HowPointEndedBar } from './HowPointEndedBar';
import { WhereWinnerBar } from './WhereWinnerBar';
import { ServeInlinePanel } from './ServeInlinePanel';
import type { HowPointEnded, WhereWinner } from './usePointAnnotationFlow';

export interface PointAnnotationBarsProps {
  isSelectWinner: boolean;
  howEnded: HowPointEnded | null;
  whereWinner: WhereWinner | null;
  hasFirstServeError: boolean;
  disabled?: boolean;
  openServeAction?: 'ace' | 'out' | 'net' | null;
  onSelectHowEnded: (option: HowPointEnded) => void;
  onSelectFault: (type: 'out' | 'net') => void;
  onConfirmServe: (effect?: string, direction?: string) => void;
  onCancelServe: () => void;
  onSelectWhereWinner: (option: WhereWinner) => void;
  onBack?: () => void;
  onCancel: () => void;
}

export function PointAnnotationBars({
  isSelectWinner, howEnded, whereWinner, hasFirstServeError, disabled = false,
  openServeAction, onSelectHowEnded, onSelectFault, onConfirmServe, onCancelServe,
  onSelectWhereWinner, onBack, onCancel,
}: PointAnnotationBarsProps) {
  const shouldShowWhereWinner = howEnded && howEnded !== 'ACE' && howEnded !== 'SERVE_FAULT';
  const whereWinnerDisabled = disabled || !shouldShowWhereWinner;

  return (
    <div
      data-testid="point-annotation-bars"
      className="flex flex-col gap-1.5 flex-shrink-0 animate-[fadeInSlideUp_0.2s_ease-out]"
    >
      <HowPointEndedBar
        selected={howEnded}
        firstServeErrorRegistered={hasFirstServeError}
        disabled={disabled}
        activeFault={openServeAction === 'out' || openServeAction === 'net' ? openServeAction : null}
        onSelect={onSelectHowEnded}
        onSelectFault={onSelectFault}
      />

      {openServeAction && (
        <div className="w-full px-[13px] animate-[fadeInSlideUp_0.2s_ease-out]">
          <div className="grid grid-cols-5 gap-1.5 w-full">
            <div className={`col-span-4 ${openServeAction === 'ace' ? 'col-start-1' : 'col-start-2'}`}>
              <ServeInlinePanel
                action={openServeAction}
                step={hasFirstServeError ? 'second' : 'first'}
                disabled={disabled}
                onConfirm={onConfirmServe}
                onCancel={onCancelServe}
              />
            </div>
          </div>
        </div>
      )}

      <WhereWinnerBar
        selected={whereWinner}
        disabled={whereWinnerDisabled}
        howEnded={howEnded}
        onSelect={onSelectWhereWinner}
        onBack={onBack}
      />

      {howEnded && !openServeAction && (
        <div className={`flex items-center gap-2 px-1 ${isSelectWinner ? 'justify-between' : 'justify-center'}`}>
          {isSelectWinner && (
            <p role="status" className="text-[clamp(11px,1.5dvh,13px)] font-semibold text-telemetry-volt truncate">
              Toque no card do jogador que venceu o ponto
            </p>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-lg border border-white/10 bg-transparent px-3 py-0.5 text-[clamp(9.5px,1.3dvh,11px)] text-telemetry-text-muted transition-colors hover:bg-white/5 whitespace-nowrap"
          >
            Cancelar anotação
          </button>
        </div>
      )}
    </div>
  );
}
