import { openDB, IDBPDatabase } from "idb";
import { logger } from "@/lib/logger";

export const DB_NAME = "racket-offline-db";
export const STORE_NAME = "optimistic-queue";
export const DB_VERSION = 2;

let cachedDb: IDBPDatabase | null = null;

export async function getOfflineDb(): Promise<IDBPDatabase> {
  if (cachedDb) {
    try {
      // Testa se a conexão ainda está válida acessando uma propriedade interna
      // em vez de .abort() (que lança AbortError visível no console mesmo dentro
      // do catch). Se a conexão foi fechada/terminada, objectStoreNames lançará.
      void cachedDb.objectStoreNames;
      return cachedDb;
    } catch {
      cachedDb = null;
    }
  }

  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("timestamp", "timestamp");
      }
      if (!db.objectStoreNames.contains("optimistic-comment-queue")) {
        const store = db.createObjectStore("optimistic-comment-queue", {
          keyPath: "id",
        });
        store.createIndex("status", "status");
        store.createIndex("timestamp", "timestamp");
      }
    },
    blocked() {
      logger.warn("[IndexedDB] Connection blocked");
    },
    blocking() {
      logger.warn("[IndexedDB] Connection blocking - closing");
      if (cachedDb) {
        cachedDb.close();
        cachedDb = null;
      }
    },
    terminated() {
      logger.warn("[IndexedDB] Connection terminated");
      cachedDb = null;
    },
  });

  cachedDb = db;
  db.onclose = () => {
    cachedDb = null;
  };
  return db;
}
