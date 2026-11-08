'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { ToastItem } from './toast-item';
import { useToastQueue } from './use-toast-queue';
import type { ToastContextValue } from './toast-types';

export type { ToastAction, ToastContextValue, ToastMessage, ToastOptions, ToastType } from './toast-types';

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const CONTAINER_CLASS = [
  'fixed z-50 inset-x-4 bottom-4 safe-bottom',
  'flex flex-col items-center gap-2',
  'sm:inset-x-auto sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end',
  'pointer-events-none',
].join(' ');

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, toast, dismiss } = useToastQueue();

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={CONTAINER_CLASS} data-testid="toast-container">
        {toasts.length === 0 && <div data-testid="toast-empty" hidden />}
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
