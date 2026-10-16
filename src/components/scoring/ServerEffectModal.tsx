'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ServerEffectModalProps } from './server-effect-modal.types';
import { ServerEffectModalHeader } from './server-effect-modal-header';
import { ServerEffectModalBody } from './server-effect-modal-body';
import { ServerEffectModalFooter } from './server-effect-modal-footer';
import { ServerEffectCloseDialog } from './server-effect-modal-close-dialog';

export function ServerEffectModal({
  context,
  serveStep,
  errorType,
  winnerName,
  fontScale,
  onConfirm,
  onCancel,
}: ServerEffectModalProps) {
  const [effect, setEffect] = useState<string | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const isDirty = effect !== null || direction !== null;
  const isDoubleFault = context === 'error' && serveStep === 'second';

  const onOverlayDismiss = useCallback(() => {
    if (!isDirty) onCancel(); else setShowCloseDialog(true);
  }, [isDirty, onCancel]);

  const updateServeEffect = useCallback((v: string) => setEffect(v), []);
  const updateServeDirection = useCallback((v: string) => setDirection(v), []);
  const confirmServerEffect = useCallback(() => onConfirm(effect ?? undefined, direction ?? undefined), [onConfirm, effect, direction]);
  const onCancelClick = useCallback(() => {
    if (isDirty) setShowCloseDialog(true); else onCancel();
  }, [isDirty, onCancel]);
  const discardAndCancel = useCallback(() => {
    setShowCloseDialog(false); onCancel();
  }, [onCancel]);

  const isError = isDoubleFault || (context === 'error' && serveStep === 'first');
  const borderColor = isError ? 'rgb(var(--telemetry-error))' : 'rgb(var(--telemetry-volt))';
  const accentGlow = isError ? 'rgb(var(--telemetry-error) / 0.15)' : 'rgb(var(--telemetry-volt) / 0.15)';

  const modal = (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      aria-label="Fechar modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOverlayDismiss();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') onOverlayDismiss();
      }}
    >
      <div
        className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(280px,90vw,400px)] mx-4 rounded-[20px] shadow-2xl flex flex-col border-t-4 bg-telemetry-card"
        style={{
          border: '1px solid rgb(var(--telemetry-border) / 0.1)',
          borderTopWidth: '4px',
          borderTopColor: borderColor,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${accentGlow}`,
          fontSize: `${fontScale * 100}%`,
        }}
        role="dialog"
        aria-label={context === 'winner' ? 'Efeito do saque' : 'Erro de saque'}
        tabIndex={-1}
      >
        <ServerEffectModalHeader
          context={context}
          serveStep={serveStep}
          errorType={errorType}
          winnerName={winnerName}
          isDoubleFault={isDoubleFault}
        />
        <ServerEffectModalBody
          context={context}
          effect={effect}
          direction={direction}
          onEffectChange={updateServeEffect}
          onDirectionChange={updateServeDirection}
          isDoubleFault={isDoubleFault}
        />
        <ServerEffectModalFooter context={context} serveStep={serveStep} onConfirm={confirmServerEffect} onCancel={onCancelClick} />
      </div>

      {showCloseDialog && (
        <ServerEffectCloseDialog onDiscard={discardAndCancel} onContinue={() => setShowCloseDialog(false)} />
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
