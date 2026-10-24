import { openDB } from "idb";

export interface PendingMatchSync {
  matchId: string;
  winnerId: string;
  finishedAt: string;
  timestamp: number;
  type: "MATCH_FINISH";
}

export async function getPendingPointsCountForMatch(matchId: string): Promise<number> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return 0;
  try {
    const db = await openDB("racket-offline-db", 2);
    if (!db.objectStoreNames.contains("optimistic-queue")) return 0;
    const pending = await db.getAllFromIndex("optimistic-queue", "status", "PENDING");
    const syncing = await db.getAllFromIndex("optimistic-queue", "status", "SYNCING");
    return [...pending, ...syncing].filter(
      (p) => (p as { matchId?: string }).matchId === matchId
    ).length;
  } catch {
    return 0;
  }
}

export async function hasPendingPointsForMatch(matchId: string): Promise<boolean> {
  const count = await getPendingPointsCountForMatch(matchId);
  return count > 0;
}

