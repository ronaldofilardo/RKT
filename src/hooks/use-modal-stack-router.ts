import { useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { AppRouteInput } from '@/lib/app-router';
import type { ModalParams } from './modal-stack.types';
import { buildModalUrl } from './modal-stack-url.logic';

export function useRouterModalStack() {
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
    routerRef.current.push(url as AppRouteInput);
  }, []);

  const replace = useCallback((name: string, params?: ModalParams) => {
    const url = buildModalUrl(pathnameRef.current, searchParamsRef.current, name, params);
    routerRef.current.replace(url as AppRouteInput);
  }, []);

  const close = useCallback(() => {
    routerRef.current.back();
  }, []);

  const closeAll = useCallback(() => {
    const sp = new URLSearchParams(searchParamsRef.current.toString());
    sp.delete('modal');
    const qs = sp.toString();
    const url = qs ? `${pathnameRef.current}?${qs}` : pathnameRef.current;
    routerRef.current.replace(url as AppRouteInput);
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
