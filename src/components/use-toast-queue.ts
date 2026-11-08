'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastMessage, ToastOptions } from './toast-types';

export const DEFAULT_TOAST_DURATION_MS = 5000;

function createToastId() {
  return Math.random().toString(36).slice(2, 11);
}

function autoDismisses(options: ToastOptions) {
  return !options.persistent && options.type !== 'loading';
}

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = options.key ?? createToastId();
      const nextToast: ToastMessage = { ...options, id };

      // Desduplicação: cancela o temporizador anterior e atualiza o conteúdo no lugar.
      clearTimer(id);
      setToasts((prev) =>
        prev.some((item) => item.id === id)
          ? prev.map((item) => (item.id === id ? nextToast : item))
          : [...prev, nextToast],
      );

      if (autoDismisses(nextToast)) {
        const duration = nextToast.durationMs ?? DEFAULT_TOAST_DURATION_MS;
        timers.current.set(id, setTimeout(() => dismiss(id), duration));
      }

      return id;
    },
    [clearTimer, dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return { toasts, toast, dismiss };
}
