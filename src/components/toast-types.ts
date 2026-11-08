export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  type: ToastType;
  message: string;
  /** Desduplica notificações: mesma key atualiza o toast existente em vez de empilhar. */
  key?: string;
  /** Erros críticos: não fecha sozinho. */
  persistent?: boolean;
  /** Ação inline (ex: "Tentar novamente"). */
  action?: ToastAction;
  /** Padrão 5000ms. Ignorado quando persistent ou loading. */
  durationMs?: number;
}

export interface ToastMessage extends ToastOptions {
  id: string;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => string;
}
