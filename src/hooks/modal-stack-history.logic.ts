import type { ModalParams } from './modal-stack.types';

export interface ModalHistoryEntry {
  modal: string | null;
  params: ModalParams;
}

export interface ResolvedModalUrl {
  modal: string | null;
  params: ModalParams;
}

export function readModalFromUrl(searchParams: URLSearchParams): ResolvedModalUrl {
  const modal = searchParams.get('modal');
  const params: ModalParams = {};
  searchParams.forEach((value, key) => {
    if (key !== 'modal') params[key] = value;
  });
  return { modal, params };
}

export function writeModalToUrl(
  ctx: { pathname: string; searchParams: URLSearchParams },
  modal: string | null,
  params: ModalParams,
  method: 'push' | 'replace' = 'replace',
): void {
  const sp = new URLSearchParams(ctx.searchParams.toString());
  if (modal) {
    sp.set('modal', modal);
    Object.entries(params).forEach(([k, v]) => sp.set(k, v));
  } else {
    sp.delete('modal');
    Object.keys(params).forEach(k => sp.delete(k));
  }
  const qs = sp.toString();
  const url = qs ? `${ctx.pathname}?${qs}` : ctx.pathname;

  if (method === 'push') {
    window.history.pushState({ modal, params }, '', url);
  } else {
    window.history.replaceState({ modal, params }, '', url);
  }
}

export function findHistoryIndex(
  history: ModalHistoryEntry[],
  modal: string | null,
  params: ModalParams,
): number {
  return history.findIndex(
    h => h.modal === modal && JSON.stringify(h.params) === JSON.stringify(params),
  );
}

export function commitHistory(
  history: ModalHistoryEntry[],
  currentIndex: number,
  entry: ModalHistoryEntry,
): { history: ModalHistoryEntry[]; index: number } {
  const existing = findHistoryIndex(history, entry.modal, entry.params);
  if (existing === -1) {
    const trimmed = history.slice(0, currentIndex + 1);
    trimmed.push(entry);
    return { history: trimmed, index: trimmed.length - 1 };
  }
  return { history, index: existing };
}
