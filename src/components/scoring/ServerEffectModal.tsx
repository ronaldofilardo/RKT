import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ServerEffectModalView } from './ServerEffectModal.view';

interface ServerEffectModalProps {
  context: 'winner' | 'error'; serveStep: 'first' | 'second'; errorType?: 'out' | 'net'; winnerName: string; fontScale: number;
  onConfirm: (effect?: string, direction?: string) => void; onCancel: () => void;
}

export function ServerEffectModal({ context, serveStep, errorType, winnerName, fontScale, onConfirm, onCancel }: ServerEffectModalProps) {
  const [effect, setEffect] = useState<string | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const isDirty = effect !== null || direction !== null;
  const isDoubleFault = context === 'error' && serveStep === 'second';
  const handleOverlayClick = useCallback(() => { if (!isDirty) onCancel(); else setShowCloseDialog(true); }, [isDirty, onCancel]);
  const handleConfirm = useCallback(() => onConfirm(effect ?? undefined, direction ?? undefined), [onConfirm, effect, direction]);
  const handleCancelClick = useCallback(() => { if (isDirty) setShowCloseDialog(true); else onCancel(); }, [isDirty, onCancel]);
  const handleDiscardAndCancel = useCallback(() => { setShowCloseDialog(false); onCancel(); }, [onCancel]);
  const modal = <ServerEffectModalView context={context} serveStep={serveStep} errorType={errorType} winnerName={winnerName} fontScale={fontScale} effect={effect} direction={direction} isDoubleFault={isDoubleFault} showCloseDialog={showCloseDialog} onOverlayClick={handleOverlayClick} onEffectChange={setEffect} onDirectionChange={setDirection} onConfirm={handleConfirm} onCancelClick={handleCancelClick} onDiscardAndCancel={handleDiscardAndCancel} onCloseDialog={() => setShowCloseDialog(false)} />;
  return createPortal(modal, document.body);
}
