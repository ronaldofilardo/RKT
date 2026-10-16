import { createOfflineMatch } from './new-match-submit.logic';

export async function saveOfflineIfNeeded(isOnline: boolean, payload: Record<string, unknown>): Promise<boolean> {
  if (isOnline) return false;
  await createOfflineMatch(payload);
  return true;
}
