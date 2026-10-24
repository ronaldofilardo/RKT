import { openDB } from "idb";

export interface PendingMatchSync {
  matchId: string;
  winnerId: string;
  finishedAt: string;
  timestamp: number;
  type: "MATCH_FINISH";
}

export async function hasPendingPointsForMatch(matchId: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return false;
  try {
    const db = await openDB("racket-offline-db", 2);
    if (!db.objectStoreNames.contains("optimistic-queue")) return false;
    const pending = await db.getAllFromIndex("optimistic-queue", "status", "PENDING");
    const syncing = await db.getAllFromIndex("optimistic-queue", "status", "SYNCING");
    return [...pending, ...syncing].some(
      (p) => (p as { matchId?: string }).matchId === matchId
    );
  } catch {
    return false;
  }
}
