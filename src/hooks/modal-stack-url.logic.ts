import type { ModalParams } from './modal-stack.types';

export function buildModalUrl(
  pathname: string,
  searchParams: { toString: () => string },
  modal: string | null,
  params?: ModalParams,
): string {
  const sp = new URLSearchParams(searchParams.toString());
  if (modal) {
    sp.set('modal', modal);
    if (params) {
      Object.entries(params).forEach(([k, v]) => sp.set(k, v));
    }
  } else {
    sp.delete('modal');
    if (params) {
      Object.keys(params).forEach(k => sp.delete(k));
    }
  }
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
