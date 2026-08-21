import { TIMEOUTS } from './constants';

const LOCK_KEY = "pendingMatchSyncs.lock";

export function acquireLocalStorageLock(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const now = Date.now();
    const existing = Number(localStorage.getItem(LOCK_KEY) ?? 0);
    if (existing && now - existing < TIMEOUTS.LOCK_TTL_MS) {
      return false;
    }
    localStorage.setItem(LOCK_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

export function releaseLocalStorageLock(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    // ignore
  }
}

export function withLocalStorageLock<T>(fn: () => Promise<T>): Promise<T> {
  if (!acquireLocalStorageLock()) {
    return Promise.reject(new Error("LOCK_HELD"));
  }
  return fn().finally(releaseLocalStorageLock);
}

export function readPendingMatchSyncs<T>(): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("pendingMatchSyncs") || "[]") as T[];
  } catch {
    return [];
  }
}

export function writePendingMatchSyncs<T>(items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pendingMatchSyncs", JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export function appendPendingMatchSync<T>(item: T): void {
  if (typeof window === "undefined") return;
  const items = readPendingMatchSyncs<T>();
  items.push(item);
  writePendingMatchSyncs(items);
}
