import type { IDBPDatabase } from "idb";
import { STORE_NAME } from "./use-offline-sync.db";

/** Dispara evento quando ainda existem ações FAILED após o flush. */
export async function dispatchStuckEventIfNeeded(db: IDBPDatabase): Promise<void> {
  const stillFailed = await db.getAllFromIndex(STORE_NAME, "status", "FAILED");
  if (stillFailed.length > 0) {
    window.dispatchEvent(
      new CustomEvent("offline-sync-stuck", {
        detail: { count: stillFailed.length },
      }),
    );
  }
}
