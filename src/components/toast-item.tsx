'use client';

import type { ToastMessage, ToastType } from './toast-types';

const ACCENT: Record<ToastType, string> = {
  success: 'border-l-telemetry-volt',
  error: 'border-l-telemetry-error',
  warning: 'border-l-telemetry-alert',
  info: 'border-l-telemetry-blue',
  loading: 'border-l-telemetry-text-muted',
};

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-telemetry-volt',
  error: 'text-telemetry-error',
  warning: 'text-telemetry-alert',
  info: 'text-telemetry-blue',
  loading: 'text-telemetry-text-muted',
};

const ICONS: Record<Exclude<ToastType, 'loading'>, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const isUrgent = toast.type === 'error' || toast.type === 'warning';

  return (
    <div
      data-testid="toast"
      data-toast-type={toast.type}
      role={isUrgent ? 'alert' : 'status'}
      aria-live={isUrgent ? 'assertive' : 'polite'}
      className={`pointer-events-auto w-full sm:max-w-sm pl-3 pr-2 py-3 rounded-lg border border-telemetry-border/20 border-l-4 bg-telemetry-card shadow-elev-raised flex items-start gap-2.5 text-telemetry-text-primary animate-slide-in-right ${ACCENT[toast.type]}`}
    >
      <span
        className={`mt-0.5 shrink-0 text-base leading-none ${ICON_COLOR[toast.type]}`}
        aria-hidden="true"
      >
        {toast.type === 'loading' ? <Spinner /> : ICONS[toast.type]}
      </span>

      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium break-words">{toast.message}</p>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="text-xs font-semibold text-telemetry-volt hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-volt"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar notificação"
        className="shrink-0 rounded p-1 text-telemetry-text-muted hover:text-telemetry-text-primary leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-volt"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
