'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const REDIRECT_DELAY_MS = 1500;

/** Mantém o banner de senha provisória visível por 1,5s antes do redirecionamento. */
export function usePasswordChangeNotice() {
  const [passwordChangeNotice, setPasswordChangeNotice] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const scheduleRedirect = useCallback((run: () => void) => {
    setPasswordChangeNotice(true);
    timer.current = setTimeout(run, REDIRECT_DELAY_MS);
  }, []);

  return { passwordChangeNotice, scheduleRedirect };
}
