'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { trapFocusWithin, resolveConfirmClasses } from './confirm-alert-dialog.logic';
import { ConfirmAlertDialogContent } from './confirm-alert-dialog.content';

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

  const onKeyDownAction = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (!loading) onCancel();
      return;
    }
    trapFocusWithin(e, dialogRef);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" data-testid="confirm-alert-dialog-overlay">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
      <ConfirmAlertDialogContent
        dialogRef={dialogRef}
        titleId={titleId}
        descriptionId={descriptionId}
        title={title}
        description={description}
        cancelRef={cancelRef}
        onKeyDown={onKeyDownAction}
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        confirmClasses={resolveConfirmClasses(variant)}
        loading={loading}
        loadingLabel={loadingLabel}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>,
    document.body,
  );
}
