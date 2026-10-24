"use client";

import { useEffect, useRef } from "react";

/**
 * Revalida a timeline do servidor quando o flush da fila offline termina
 * (evento global "offline-sync-complete"), evitando que o resumo do set
 * fique com pontos antigos até o próximo refetch manual.
 */
export function useTimelineRefetchOnSync(
  fetchTimelinePoints?: () => Promise<void> | void,
): void {
  const fetchRef = useRef(fetchTimelinePoints);
  fetchRef.current = fetchTimelinePoints;

  useEffect(() => {
    const onSyncComplete = () => {
      void fetchRef.current?.();
    };
    window.addEventListener("offline-sync-complete", onSyncComplete);
    return () => window.removeEventListener("offline-sync-complete", onSyncComplete);
  }, []);
}
