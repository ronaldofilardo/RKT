'use client';

import { useRef, useEffect } from 'react';

export function useNewAthleteModalFocus(isOpen: boolean) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
    }
  }, [isOpen]);

  return { nameInputRef };
}