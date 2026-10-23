'use client';

import { useCallback } from 'react';
import type { ModalParams } from './modal-stack.types';
import { commitHistory } from './modal-stack-history.logic';
import type { InternalModalStateContext } from './use-modal-stack-internal-state';

export function useInternalModalActions({
  setInternalModal,
  setInternalParams,
  syncToUrlRef,
  modalHistoryRef,
  historyIndexRef,
}: InternalModalStateContext) {

  const open = useCallback((name: string, params?: ModalParams) => {
    const newParams = params || {};
    setInternalModal(name);
    setInternalParams(newParams);
    syncToUrlRef.current(name, newParams, 'push');
    const committed = commitHistory(modalHistoryRef.current, historyIndexRef.current, { modal: name, params: newParams });
    modalHistoryRef.current = committed.history;
    historyIndexRef.current = committed.index;
  }, [setInternalModal, setInternalParams, syncToUrlRef, modalHistoryRef, historyIndexRef]);

  const replace = useCallback((name: string, params?: ModalParams) => {
    const newParams = params || {};
    setInternalModal(name);
    setInternalParams(newParams);
    syncToUrlRef.current(name, newParams, 'replace');
    const committed = commitHistory(modalHistoryRef.current, historyIndexRef.current, { modal: name, params: newParams });
    modalHistoryRef.current = committed.history;
    historyIndexRef.current = committed.index;
  }, [setInternalModal, setInternalParams, syncToUrlRef, modalHistoryRef, historyIndexRef]);

  const close = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prev = modalHistoryRef.current[historyIndexRef.current];
      setInternalModal(prev.modal);
      setInternalParams(prev.params);
      syncToUrlRef.current(prev.modal, prev.params, 'replace');
    } else {
      setInternalModal(null);
      setInternalParams({});
      syncToUrlRef.current(null, {}, 'replace');
    }
  }, [setInternalModal, setInternalParams, syncToUrlRef, modalHistoryRef, historyIndexRef]);

  const closeAll = useCallback(() => {
    setInternalModal(null);
    setInternalParams({});
    syncToUrlRef.current(null, {}, 'replace');
    if (modalHistoryRef.current.length > 0) {
      modalHistoryRef.current = modalHistoryRef.current.slice(0, 1);
      modalHistoryRef.current[0] = { modal: null, params: {} };
      historyIndexRef.current = 0;
    }
  }, [setInternalModal, setInternalParams, syncToUrlRef, modalHistoryRef, historyIndexRef]);

  return { open, replace, close, closeAll };
}
