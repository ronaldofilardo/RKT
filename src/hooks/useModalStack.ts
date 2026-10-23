'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import type { ModalParams, ModalStackOptions } from './modal-stack.types';
import { useRouterModalStack } from './use-modal-stack-router';
import {
  commitHistory,
  findHistoryIndex,
  readModalFromUrl,
  writeModalToUrl,
  type ModalHistoryEntry,
} from './modal-stack-history.logic';

function useInternalModalStack() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [internalModal, setInternalModal] = useState<string | null>(null);
  const [internalParams, setInternalParams] = useState<ModalParams>({});

  const modalHistoryRef = useRef<ModalHistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const isSyncWithUrlRef = useRef(true);
  const [, forceUpdate] = useState({});

  const syncToUrl = useCallback((modal: string | null, params: ModalParams, method: 'push' | 'replace' = 'replace') => {
    writeModalToUrl({ pathname: pathnameRef.current, searchParams: searchParamsRef.current }, modal, params, method);
  }, []);

  const syncToUrlRef = useRef(syncToUrl);
  syncToUrlRef.current = syncToUrl;

  useEffect(() => {
    const onPopStateNavigation = (event: PopStateEvent) => {
      isSyncWithUrlRef.current = false;
      const resolved =
        event.state && event.state.modal !== undefined
          ? { modal: event.state.modal as string | null, params: (event.state.params || {}) as ModalParams }
          : readModalFromUrl(searchParamsRef.current);
      setInternalModal(resolved.modal);
      setInternalParams(resolved.params);
      historyIndexRef.current = findHistoryIndex(modalHistoryRef.current, resolved.modal, resolved.params);
      isSyncWithUrlRef.current = true;
      forceUpdate({});
    };

    window.addEventListener('popstate', onPopStateNavigation);
    return () => window.removeEventListener('popstate', onPopStateNavigation);
  }, []);

  useEffect(() => {
    if (!isSyncWithUrlRef.current) return;

    const { modal, params } = readModalFromUrl(searchParamsRef.current);

    if (modal !== internalModal || JSON.stringify(params) !== JSON.stringify(internalParams)) {
      setInternalModal(modal);
      setInternalParams(params);
      const committed = commitHistory(modalHistoryRef.current, historyIndexRef.current, { modal, params });
      modalHistoryRef.current = committed.history;
      historyIndexRef.current = committed.index;
    }
  }, [searchParams, internalModal, internalParams]);

  const open = useCallback((name: string, params?: ModalParams) => {
    const newParams = params || {};
    setInternalModal(name);
    setInternalParams(newParams);
    syncToUrlRef.current(name, newParams, 'push');
    const committed = commitHistory(modalHistoryRef.current, historyIndexRef.current, { modal: name, params: newParams });
    modalHistoryRef.current = committed.history;
    historyIndexRef.current = committed.index;
  }, []);

  const replace = useCallback((name: string, params?: ModalParams) => {
    const newParams = params || {};
    setInternalModal(name);
    setInternalParams(newParams);
    syncToUrlRef.current(name, newParams, 'replace');
    const committed = commitHistory(modalHistoryRef.current, historyIndexRef.current, { modal: name, params: newParams });
    modalHistoryRef.current = committed.history;
    historyIndexRef.current = committed.index;
  }, []);

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
  }, []);

  const closeAll = useCallback(() => {
    setInternalModal(null);
    setInternalParams({});
    syncToUrlRef.current(null, {}, 'replace');
    if (modalHistoryRef.current.length > 0) {
      modalHistoryRef.current = modalHistoryRef.current.slice(0, 1);
      modalHistoryRef.current[0] = { modal: null, params: {} };
      historyIndexRef.current = 0;
    }
  }, []);

  return {
    activeModal: internalModal,
    modalParams: internalParams,
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