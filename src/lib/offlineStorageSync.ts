import { TIMEOUTS } from './constants';

const LOCK_KEY = "pendingMatchSyncs.lock";

export function acquireLocalStorageLock(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const now = Date.now();
    const raw = localStorage.getItem(LOCK_KEY);
    const existing = raw ? Number(raw.includes(":") ? raw.split(":")[0] : raw) : 0;
    if (existing && now - existing < TIMEOUTS.LOCK_TTL_MS) {
      return false;
    }
    const token = `${now}:${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(LOCK_KEY, token);
    // Verificação dupla para mitigar colisões concorrentes entre abas
    if (localStorage.getItem(LOCK_KEY) !== token) {
      return false;
    }
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

export function appendPendingMatchSync<T extends { matchId?: string }>(item: T): void {
  if (typeof window === "undefined") return;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const items = readPendingMatchSyncs<T>();
      const isDuplicate = item.matchId
        ? items.some((existing) => existing.matchId === item.matchId)
        : false;
      if (!isDuplicate) {
        items.push(item);
        writePendingMatchSyncs(items);
      }
      return;
    } catch {
      if (attempt === 1) return;
    }
  }
}
