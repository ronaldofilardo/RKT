'use client';

import type { ModalStackOptions } from './modal-stack.types';
import { useRouterModalStack } from './use-modal-stack-router';
import { useInternalModalState } from './use-modal-stack-internal-state';
import { useInternalModalActions } from './use-modal-stack-internal-actions';

function useInternalModalStack() {
  const state = useInternalModalState();
  const { open, replace, close, closeAll } = useInternalModalActions(state);

  return {
    activeModal: state.internalModal,
    modalParams: state.internalParams,
    open,
    replace,
    close,
    closeAll,
  };
}

export function useModalStack(options: ModalStackOptions = {}) {
  const mode = options.mode ?? 'router';
  const routerStack = useRouterModalStack();
  const internalStack = useInternalModalStack();

  return mode === 'internal' ? internalStack : routerStack;
}
