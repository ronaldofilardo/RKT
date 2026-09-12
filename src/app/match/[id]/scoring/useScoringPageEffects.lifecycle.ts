import { useEffect } from "react";
import type { ScoringPageState } from "./useScoringPageState";

type LifecycleProps = {
  state: ScoringPageState;
  fetchMatch: () => void;
  fetchPointLogAudioMeta: () => void;
  syncPendingMatches: () => void;
};

export function useScoringPageLifecycle({ state, fetchMatch, fetchPointLogAudioMeta, syncPendingMatches }: LifecycleProps) {
  const { tokenRef, match, viewMode, isOnline, setSyncStatus, toast, scoreState, setElapsed, session, pendingEditScore, setPendingEditScore, setFloorCurrentSets, open } = state;

  useEffect(() => { tokenRef.current = sessionStorage.getItem("access_token"); }, [tokenRef]);
  useEffect(() => { fetchMatch(); }, [fetchMatch]);
  useEffect(() => { if (viewMode === 'timeline' && match) fetchPointLogAudioMeta(); }, [viewMode, match, fetchPointLogAudioMeta]);
  useEffect(() => {
    if (isOnline) {
      setSyncStatus("syncing");
      syncPendingMatches();
      const timer = setTimeout(() => {
        setSyncStatus((current) => (current === 'syncing' ? 'synced' : current));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSyncStatus("offline");
    }
  }, [isOnline, syncPendingMatches, setSyncStatus]);
  useEffect(() => { const handleSyncComplete = () => { setSyncStatus("synced"); toast({ type: "success", message: "Pontos offline sincronizados com sucesso" }); }; window.addEventListener("offline-sync-complete", handleSyncComplete); return () => window.removeEventListener("offline-sync-complete", handleSyncComplete); }, [toast, setSyncStatus]);
  useEffect(() => { if (scoreState?.startedAt) { const startedAtMs = scoreState.startedAt; setElapsed(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))); } else setElapsed(0); }, [scoreState?.startedAt, setElapsed]);
  useEffect(() => { if (session.pendingEditScore) setPendingEditScore(session.pendingEditScore); }, [session.pendingEditScore, setPendingEditScore]);
  useEffect(() => { if (pendingEditScore) { setFloorCurrentSets(pendingEditScore.floorSets); open("edit-score"); } }, [pendingEditScore, open, setFloorCurrentSets]);

  // Quando o modal "edit-score" é aberto (via botão Editar ou URL ?modal=edit-score),
  // calcular o floor a partir do engine para validar que o usuário não insira
  // um placar inferior ao registrado.
  useEffect(() => {
    if (state.activeModal === 'edit-score' && state.engineRef.current) {
      const currentState = state.engineRef.current.getState();
      const lastSet = currentState.sets[currentState.sets.length - 1];
      if (lastSet) {
        const isTiebreakActive = lastSet.isTiebreak && lastSet.tiebreakScore &&
          (lastSet.player1 > 0 || lastSet.player2 > 0);
        const floor = isTiebreakActive
          ? { player1: lastSet.tiebreakScore!.player1, player2: lastSet.tiebreakScore!.player2 }
          : { player1: lastSet.player1, player2: lastSet.player2 };
        setFloorCurrentSets(floor);
      }
    }
  }, [state.activeModal, state.engineRef, setFloorCurrentSets]);
}
