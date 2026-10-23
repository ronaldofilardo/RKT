import { AsyncLocalStorage } from 'async_hooks';

export interface RLSUser {
  id: string;
  role: string;
}

let rlsStorage = new AsyncLocalStorage<RLSUser>();

const VALID_ROLES = ['ADMIN', 'ANNOTATOR'] as const;

function isValidRole(role: string): role is typeof VALID_ROLES[number] {
  return (VALID_ROLES as readonly string[]).includes(role);
}

export function isValidRLSUser(user: RLSUser | null): user is RLSUser {
  if (!user) return false;
  if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
    return false;
  }
  if (!isValidRole(user.role)) {
    return false;
  }
  return true;
}

export function getRLSStore(): RLSUser | null {
  return rlsStorage.getStore() ?? null;
}

export function runWithStore<T>(user: RLSUser, fn: () => Promise<T>): Promise<T> {
  return rlsStorage.run(user, fn);
}

export function runWithStoreSync<T>(user: RLSUser, fn: () => T): T {
  return rlsStorage.run(user, fn);
}

export function resetRLSStorage(): void {
  rlsStorage = new AsyncLocalStorage<RLSUser>();
}

export function enterRLSStore(user: RLSUser): void {
  rlsStorage.enterWith(user);
}
