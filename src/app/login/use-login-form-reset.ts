'use client';

import { useEffect, useRef, type MutableRefObject } from 'react';

/** Reseta o formulário ao montar e quando o navegador restaura a página do histórico. */
export function useLoginFormReset(onReset: () => void): MutableRefObject<HTMLFormElement | null> {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const reset = () => {
      formRef.current?.reset();
      onReset();
    };
    reset();
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reset();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [onReset]);

  return formRef;
}
