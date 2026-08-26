import { useEffect } from "react";
import type { ScoringPageState } from "./useScoringPageState";

type LifecycleProps = {
  state: ScoringPageState;
  fetchMatch: () => void;
  fetchPointLogAudioMeta: () => void;
  syncPendingMatches: () => void;
};

export function useScoringPageLifecycle({ state, fetchMatch, fetchPointLogAudioMeta, syncPendingMatches }: LifecycleProps) {
  const { tokenRef, match, viewMode, isOnline, setSyncStatus, toast, scoreState, setElapsed, timerRef, session, pendingEditScore, setPendingEditScore, setFloorCurrentSets, open } = state;

  useEffect(() => { tokenRef.current = sessionStorage.getItem("access_token"); }, [tokenRef]);
  useEffect(() => { fetchMatch(); }, [fetchMatch]);
  useEffect(() => { if (viewMode === 'timeline' && match) fetchPointLogAudioMeta(); }, [viewMode, match, fetchPointLogAudioMeta]);
  useEffect(() => { if (isOnline) { setSyncStatus("syncing"); syncPendingMatches(); } else setSyncStatus("offline"); }, [isOnline, syncPendingMatches, setSyncStatus]);
  useEffect(() => { const handleSyncComplete = () => { setSyncStatus("synced"); toast({ type: "success", message: "Pontos offline sincronizados com sucesso" }); }; window.addEventListener("offline-sync-complete", handleSyncComplete); return () => window.removeEventListener("offline-sync-complete", handleSyncComplete); }, [toast, setSyncStatus]);
  useEffect(() => { if (scoreState?.startedAt) { const startedAtMs = scoreState.startedAt; setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))); timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000); } else setElapsed(0); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [scoreState?.startedAt, setElapsed, timerRef]);
  useEffect(() => { if (session.pendingEditScore) setPendingEditScore(session.pendingEditScore); }, [session.pendingEditScore, setPendingEditScore]);
  useEffect(() => { if (pendingEditScore) { setFloorCurrentSets(pendingEditScore.floorSets); open("edit-score"); } }, [pendingEditScore, open, setFloorCurrentSets]);
}
