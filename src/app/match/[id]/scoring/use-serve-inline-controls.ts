'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ServeAction, ServeInlineControlsProps } from '@/components/scoring/serve-inline.types';
import type { ScoringPageDerived, ScoringPageEffects, ScoringPageState } from './use-scoring-page-chrome';

/**
 * Estado da UI de saque em /scoring: checkboxes de detalhe (rodapé) e qual
 * painel inline (Ace/Out/Net) está expandido sob o card do sacador.
 * A regra de negócio continua nos handlers existentes (confirmServerEffect, confirmServeError, record...).
 */
export function useServeInlineControls(
  state: ScoringPageState,
  handlers: ScoringPageEffects,
  derived: ScoringPageDerived,
) {
  const [aceDetails, setAceDetails] = useState(false);
  const [dfDetails, setDfDetails] = useState(false);
  const [openAction, setOpenAction] = useState<ServeAction | null>(null);
  const step = state.serveErrorState?.serveStep === 'second' ? 'second' : 'first';
  const disabled = Boolean(derived.isFinished || derived.isProcessingPoint);
  const { dismissServeErrorDetails, startServeErrorDetails } = handlers;

  const openRef = useRef(openAction);
  openRef.current = openAction;

  const close = useCallback(() => {
    if (openRef.current && openRef.current !== 'ace') dismissServeErrorDetails();
    setOpenAction(null);
  }, [dismissServeErrorDetails]);

  const onAction = (action: ServeAction) => {
    if (disabled) return;
    if (openAction === action) return close();
    if (action === 'ace') return aceDetails ? (close(), setOpenAction('ace')) : (close(), handlers.recordAceDirectly());
    if (!dfDetails) return handlers.recordDirectServeError(action, step);
    startServeErrorDetails(action, step);
    setOpenAction(action);
  };

  const onConfirm = (effect?: string, direction?: string) => {
    const run = openAction === 'ace' ? handlers.confirmServerEffect : handlers.confirmServeError;
    setOpenAction(null);
    run(effect, direction);
  };

  // Fecha o painel quando o contexto muda por outro caminho (ponto, undo, modal, troca de sacador).
  const resetKey = `${state.pointsHistory?.length ?? 0}|${step}|${state.activeModal ?? ''}|${derived.p1IsServing}`;
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (openRef.current) closeRef.current();
  }, [resetKey]);

  const toggle = (set: (fn: (v: boolean) => boolean) => void) => () => { close(); set((v) => !v); };

  const controls: ServeInlineControlsProps = {
    step, disabled, processing: Boolean(derived.isProcessingPoint), openAction, onAction, onConfirm, onCancel: close,
  };
  return {
    controls,
    options: {
      aceDetailsEnabled: aceDetails,
      dfDetailsEnabled: dfDetails,
      onAceDetailsToggle: toggle(setAceDetails),
      onDfDetailsToggle: toggle(setDfDetails),
    },
  };
}

export type ServeInlineControlsState = ReturnType<typeof useServeInlineControls>;
