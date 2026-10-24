"use client";

import { useEffect } from "react";

type ToastFn = (t: { type: "success" | "error" | "info"; message: string }) => void;

type SyncStatus = "syncing" | "synced" | "offline" | "auth-required";

export function useSyncStatusEffects(
  isOnline: boolean,
  setSyncStatus: React.Dispatch<React.SetStateAction<SyncStatus>>,
  syncPendingMatches: () => Promise<void>,
  toast: ToastFn,
): void {
  useEffect(() => {
    if (isOnline) {
      setSyncStatus("syncing");
      syncPendingMatches();
      const timer = setTimeout(() => {
        setSyncStatus((current) =>
          current === "syncing" ? "synced" : current,
        );
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSyncStatus("offline");
    }
  }, [isOnline, syncPendingMatches, setSyncStatus]);

  useEffect(() => {
    const completeSyncCycle = () => {
      setSyncStatus("synced");
      toast({
        type: "success",
        message: "Pontos offline sincronizados com sucesso",
      });
    };
    window.addEventListener("offline-sync-complete", completeSyncCycle);
    return () =>
      window.removeEventListener("offline-sync-complete", completeSyncCycle);
  }, [toast, setSyncStatus]);
}

export function useElapsedTimer(
  startedAt: string | number | null | undefined,
  setElapsed: (v: number) => void,
): void {
  useEffect(() => {
    if (startedAt) {
      const startedAtMs =
        typeof startedAt === "number"
          ? startedAt
          : new Date(startedAt).getTime();
      const update = () => {
        setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [startedAt, setElapsed]);
}
