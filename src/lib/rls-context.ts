import { AsyncLocalStorage } from 'async_hooks';

export interface RLSUser {
  id: string;
  role: string;
}

const rlsStorage = new AsyncLocalStorage<RLSUser>();

export function getRLSUser(): RLSUser | null {
  return rlsStorage.getStore() ?? null;
}

export function setRLSUser(user: RLSUser | null): void {
  if (user) {
    rlsStorage.enterWith(user);
  } else {
    rlsStorage.disable();
  }
}
