import { logger } from './logger';

export async function purgeOfflineCaches(): Promise<void> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return;
  }

  try {
    // 1. Limpa racket_pending_matches
    const req1 = indexedDB.open('racket_pending_matches', 1);
    req1.onsuccess = () => {
      const db = req1.result;
      if (db.objectStoreNames.contains('pending_matches')) {
        const tx = db.transaction('pending_matches', 'readwrite');
        tx.objectStore('pending_matches').clear();
      }
    };
  } catch (err) {
    logger.warn('[purgeOfflineCaches] Erro ao limpar racket_pending_matches:', err);
  }

  try {
    // 2. Limpa racket-offline-db
    const req2 = indexedDB.open('racket-offline-db', 2);
    req2.onsuccess = () => {
      const db = req2.result;
      const stores = ['optimistic-queue', 'optimistic-comment-queue'];
      for (const storeName of stores) {
        if (db.objectStoreNames.contains(storeName)) {
          const tx = db.transaction(storeName, 'readwrite');
          tx.objectStore(storeName).clear();
        }
      }
    };
  } catch (err) {
    logger.warn('[purgeOfflineCaches] Erro ao limpar racket-offline-db:', err);
  }
}

