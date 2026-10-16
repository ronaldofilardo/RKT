'use client';

interface ConfirmAlertDialogContentProps {
  dialogRef: React.RefObject<HTMLDivElement>;
  titleId: string;
  descriptionId: string;
  title: string;
  description?: React.ReactNode;
  cancelRef: React.RefObject<HTMLButtonElement>;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  cancelLabel: string;
  confirmLabel: string;
  confirmClasses: string;
  loading: boolean;
  loadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmAlertDialogContent({
  dialogRef,
  titleId,
  descriptionId,
  title,
  description,
  cancelRef,
  onKeyDown,
  cancelLabel,
  confirmLabel,
  confirmClasses,
  loading,
  loadingLabel,
  onConfirm,
  onCancel,
}: ConfirmAlertDialogContentProps) {
  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
    <div
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onKeyDown={onKeyDown}
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
  );
}
