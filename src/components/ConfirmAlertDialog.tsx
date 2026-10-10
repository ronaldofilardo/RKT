'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmAlertDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" pinta o botão de confirmação de vermelho (ações destrutivas). */
  variant?: 'default' | 'danger';
  /** Enquanto true, desabilita os botões e mostra `loadingLabel` no confirmar. */
  loading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Substitui o `window.confirm()` nativo por um diálogo integrado ao tema
 * (role="alertdialog"), conforme WAI-ARIA:
 *  - foco inicial no botão CANCELAR (ação segura);
 *  - Escape cancela; Tab/Shift+Tab ficam presos dentro do diálogo;
 *  - clicar no fundo NÃO fecha (o usuário precisa decidir explicitamente);
 *  - ao fechar, o foco volta para o elemento que o abriu.
 */
export function ConfirmAlertDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  loadingLabel,
  onConfirm,
  onCancel,
}: ConfirmAlertDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (!loading) onCancel();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  const confirmClasses =
    variant === 'danger'
      ? 'bg-telemetry-error hover:opacity-90 text-white'
      : 'bg-telemetry-volt hover:opacity-90 text-telemetry-base';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" data-testid="confirm-alert-dialog-overlay">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-telemetry-card p-6 text-center shadow-2xl"
      >
        <h2 id={titleId} className="mb-2 text-xl font-bold text-telemetry-text-primary">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mb-6 text-sm text-telemetry-text-muted">
            {description}
          </p>
        )}
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-telemetry-elevated px-4 py-3 font-semibold text-telemetry-text-primary transition-all hover:bg-telemetry-active disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold transition-all disabled:opacity-50 ${confirmClasses}`}
          >
            {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
