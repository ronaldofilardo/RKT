const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Prende Tab/Shift+Tab dentro do diálogo (WAI-ARIA focus trap). */
export function trapFocusWithin(
  e: React.KeyboardEvent<HTMLDivElement>,
  dialogRef: React.RefObject<HTMLDivElement>
) {
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
}

export function resolveConfirmClasses(variant: 'default' | 'danger'): string {
  return variant === 'danger'
    ? 'bg-telemetry-error hover:opacity-90 text-white'
    : 'bg-telemetry-volt hover:opacity-90 text-telemetry-base';
}
