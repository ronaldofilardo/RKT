'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface ModalParams {
  [key: string]: string;
}

type ModalMode = 'router' | 'internal';

export interface ModalStackOptions {
  mode?: ModalMode;
}

function buildModalUrl(
  pathname: string,
  searchParams: { toString: () => string },
  modal: string | null,
  params?: ModalParams,
): string {
  const sp = new URLSearchParams(searchParams.toString());
  if (modal) {
    sp.set('modal', modal);
    if (params) {
      Object.entries(params).forEach(([k, v]) => sp.set(k, v));
    }
  } else {
    sp.delete('modal');
    if (params) {
      Object.keys(params).forEach(k => sp.delete(k));
    }
  }
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function useRouterModalStack() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const routerRef = useRef(router);
  routerRef.current = router;

  const activeModal = searchParams.get('modal');

  const modalParams = useMemo<ModalParams>(() => {
    const params: ModalParams = {};
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'modal') params[key] = value;
    }
    return params;
  }, [searchParams]);

  const open = useCallback((name: string, params?: ModalParams) => {
    const url = buildModalUrl(pathnameRef.current, searchParamsRef.current, name, params);
    routerRef.current.push(url as any);
  }, []);

  const replace = useCallback((name: string, params?: ModalParams) => {
    const url = buildModalUrl(pathnameRef.current, searchParamsRef.current, name, params);
    routerRef.current.replace(url as any);
  }, []);

  const close = useCallback(() => {
    routerRef.current.back();
  }, []);

  const closeAll = useCallback(() => {
    const sp = new URLSearchParams(searchParamsRef.current.toString());
    sp.delete('modal');
    const qs = sp.toString();
    const url = qs ? `${pathnameRef.current}?${qs}` : pathnameRef.current;
    routerRef.current.replace(url as any);
  }, []);

  return {
    activeModal,
    modalParams,
    open,
    replace,
    close,
    closeAll,
  };
}

function useInternalModalStack() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const [internalModal, setInternalModal] = useState<string | null>(null);
  const [internalParams, setInternalParams] = useState<ModalParams>({});

  const modalHistoryRef = useRef<Array<{ modal: string | null; params: ModalParams }>>([]);
  const historyIndexRef = useRef(-1);
  const isSyncWithUrlRef = useRef(true);
  const [, forceUpdate] = useState({});

  const syncToUrl = useCallback((modal: string | null, params: ModalParams, method: 'push' | 'replace' = 'replace') => {
    const sp = new URLSearchParams(searchParamsRef.current.toString());
    if (modal) {
      sp.set('modal', modal);
      Object.entries(params).forEach(([k, v]) => sp.set(k, v));
    } else {
      sp.delete('modal');
      Object.keys(params).forEach(k => sp.delete(k));
    }
    const qs = sp.toString();
    const url = qs ? `${pathnameRef.current}?${qs}` : pathnameRef.current;

    if (method === 'push') {
      window.history.pushState({ modal, params }, '', url);
    } else {
      window.history.replaceState({ modal, params }, '', url);
    }
  }, []);

  const syncToUrlRef = useRef(syncToUrl);
  syncToUrlRef.current = syncToUrl;

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      isSyncWithUrlRef.current = false;
      if (event.state && event.state.modal !== undefined) {
        setInternalModal(event.state.modal);
        setInternalParams(event.state.params || {});
        historyIndexRef.current = modalHistoryRef.current.findIndex(
          h => h.modal === event.state.modal && JSON.stringify(h.params) === JSON.stringify(event.state.params || {})
        );
      } else {
        const sp = searchParamsRef.current;
        const modal = sp.get('modal');
        const params: ModalParams = {};
        sp.forEach((v, k) => { if (k !== 'modal') params[k] = v; });
        setInternalModal(modal);
        setInternalParams(params);
        historyIndexRef.current = modalHistoryRef.current.findIndex(
          h => h.modal === modal && JSON.stringify(h.params) === JSON.stringify(params)
        );
      }
      isSyncWithUrlRef.current = true;
      forceUpdate({});
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isSyncWithUrlRef.current) return;

    const sp = searchParamsRef.current;
    const modal = sp.get('modal');
    const params: ModalParams = {};
    sp.forEach((v, k) => { if (k !== 'modal') params[k] = v; });

    if (modal !== internalModal || JSON.stringify(params) !== JSON.stringify(internalParams)) {
      setInternalModal(modal);
      setInternalParams(params);

      const existingIndex = modalHistoryRef.current.findIndex(
        h => h.modal === modal && JSON.stringify(h.params) === JSON.stringify(params)
      );
      if (existingIndex === -1) {
        modalHistoryRef.current = modalHistoryRef.current.slice(0, historyIndexRef.current + 1);
        modalHistoryRef.current.push({ modal, params });
        historyIndexRef.current = modalHistoryRef.current.length - 1;
      } else {
        historyIndexRef.current = existingIndex;
      }
    }
  }, [searchParams, internalModal, internalParams]);

  const open = useCallback((name: string, params?: ModalParams) => {
    const newParams = params || {};
    setInternalModal(name);
    setInternalParams(newParams);
    syncToUrlRef.current(name, newParams, 'push');
    modalHistoryRef.current = modalHistoryRef.current.slice(0, historyIndexRef.current + 1);
    modalHistoryRef.current.push({ modal: name, params: newParams });
    historyIndexRef.current = modalHistoryRef.current.length - 1;
  }, []);

  const replace = useCallback((name: string, params?: ModalParams) => {
    const newParams = params || {};
    setInternalModal(name);
    setInternalParams(newParams);
    syncToUrlRef.current(name, newParams, 'replace');
    modalHistoryRef.current = modalHistoryRef.current.slice(0, historyIndexRef.current + 1);
    modalHistoryRef.current.push({ modal: name, params: newParams });
    historyIndexRef.current = modalHistoryRef.current.length - 1;
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