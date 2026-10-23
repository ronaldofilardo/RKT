import { useState, useEffect } from "react";

type SyncStatus = "offline" | "syncing" | "synced" | "auth-required";

export function useSyncStatusState(isOnline: boolean) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isOnline ? "synced" : "offline"
  );

  // Listen for auth-required event from offline sync
  useEffect(() => {
    const requireAuthentication = () => {
      setSyncStatus("auth-required");
    };
    window.addEventListener("offline-sync-auth-required", requireAuthentication);
    return () => {
      window.removeEventListener("offline-sync-auth-required", requireAuthentication);
    };
  }, []);

  // Also reset auth-required when sync completes
  useEffect(() => {
    const completeSyncCycle = () => {
      if (syncStatus === "auth-required") {
        setSyncStatus(isOnline ? "synced" : "offline");
      }
    };
    window.addEventListener("offline-sync-complete", completeSyncCycle);
    return () => {
      window.removeEventListener("offline-sync-complete", completeSyncCycle);
    };
  }, [isOnline, syncStatus]);

  return { syncStatus, setSyncStatus };
}
