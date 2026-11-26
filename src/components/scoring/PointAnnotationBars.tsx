'use client';

import { HowPointEndedBar } from './HowPointEndedBar';
import { WhereWinnerBar } from './WhereWinnerBar';
import { ServeInlinePanel } from './ServeInlinePanel';
import { DoublesFormationModal } from './DoublesFormationModal';
import { PointAnnotationCancelRow } from './point-annotation-cancel-row';
import type { DoublesFormation } from '@/core/scoring/types';
import type { HowPointEnded, WhereWinner } from './usePointAnnotationFlow';

export interface PointAnnotationBarsProps {
  isDoubles?: boolean;
  isDoublesFormation?: boolean;
  doublesFormation?: DoublesFormation | null;
  onSelectDoublesFormation?: (formation: DoublesFormation) => void;
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
  isDoubles = false, isDoublesFormation = false, doublesFormation = null, onSelectDoublesFormation,
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
        isDoubles={isDoubles}
        onSelect={onSelectWhereWinner}
        onBack={onBack}
      />

      {isDoublesFormation && onSelectDoublesFormation && (
        <DoublesFormationModal
          isOpen={true}
          selected={doublesFormation}
          onSelect={onSelectDoublesFormation}
          onCancel={onBack ?? onCancel}
        />
      )}

      {howEnded && !openServeAction && (
        <PointAnnotationCancelRow isSelectWinner={isSelectWinner} onCancel={onCancel} />
      )}
    </div>
  );
}
