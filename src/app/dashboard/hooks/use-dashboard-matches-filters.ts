import { useMemo } from "react";
import type { DashboardMatchPayload } from "@/components/dashboard/MatchCard";

export function useDashboardMatchFilters(matches: DashboardMatchPayload[], suspendedFromApi: DashboardMatchPayload[]) {
  const finishedMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "FINISHED"),
    [matches],
  );

  const liveMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "IN_PROGRESS"),
    [matches],
  );

  const pendingMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "SCHEDULED"),
    [matches],
  );

  const historyMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "FINISHED" || m.state === "CANCELLED"),
    [matches],
  );

  const visibleMatches = useMemo(() => {
    if (suspendedFromApi.length === 0) return matches;
    const suspendedIds = new Set(suspendedFromApi.map((m: DashboardMatchPayload) => m.id));
    return matches.filter((m: DashboardMatchPayload) => !suspendedIds.has(m.id));
  }, [matches, suspendedFromApi]);

  return {
    finishedMatches,
    liveMatches,
    pendingMatches,
    historyMatches,
    visibleMatches,
  };
}
