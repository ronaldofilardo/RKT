'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import type { ModalParams } from './modal-stack.types';
import {
  commitHistory,
  findHistoryIndex,
  readModalFromUrl,
  writeModalToUrl,
  type ModalHistoryEntry,
} from './modal-stack-history.logic';

export type SyncToUrlFn = (modal: string | null, params: ModalParams, method?: 'push' | 'replace') => void;

export interface InternalModalStateContext {
  internalModal: string | null;
  internalParams: ModalParams;
  setInternalModal: Dispatch<SetStateAction<string | null>>;
  setInternalParams: Dispatch<SetStateAction<ModalParams>>;
  syncToUrlRef: MutableRefObject<SyncToUrlFn>;
  modalHistoryRef: MutableRefObject<ModalHistoryEntry[]>;
  historyIndexRef: MutableRefObject<number>;
}

export function useInternalModalState(): InternalModalStateContext {
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

  const syncToUrlRef = useRef<SyncToUrlFn>(syncToUrl);
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

  return {
    internalModal,
    internalParams,
    setInternalModal,
    setInternalParams,
    syncToUrlRef,
    modalHistoryRef,
    historyIndexRef,
  };
}
