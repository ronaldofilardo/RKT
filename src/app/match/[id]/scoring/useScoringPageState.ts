"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useOfflineMatchSync } from "@/hooks/useOfflineMatchSync";
import { useToast } from "@/components/Toast";
import { useModalStack } from "@/hooks/useModalStack";
import { useSession } from "@/contexts/SessionContext";
import {
  useScoringTimelineSync,
  type MatchCommentData,
} from "./useScoringTimelineSync";
import type { ScoringPageState } from "./useScoringPageState.types";
import { useScoringPageLocalState } from "./use-scoring-page-local-state";
import { useSyncStatusState } from "./use-scoring-page-sync-status";

export type { MatchCommentData };
export type { ScoringPageState } from "./useScoringPageState.types";

export function useScoringPageState(matchId: string): ScoringPageState {
  const router = useRouter();
  const { enqueue, clearQueueForMatch, removeLastAction, isOnline } = useOfflineSync();
  const { syncPendingMatches } = useOfflineMatchSync();
  const { toast } = useToast();

  const sync = useSyncStatusState(isOnline);

  const local = useScoringPageLocalState();

  const {
    timelinePoints,
    fetchTimelinePoints,
    fetchPointLogAudioMeta,
    comments,
    setComments,
    fetchComments,
  } = useScoringTimelineSync({
    matchId,
    match: local.match,
    scoreState: local.scoreState,
    engineRef: local.engineRef,
    engineTick: local.engineTick,
    tokenRef: local.tokenRef,
  });

  const { activeModal, modalParams, open, close, closeAll } =
    useModalStack({ mode: "internal" });
  const { session, clearPendingEdit, updateScore, setPendingEdit } = useSession();
  const modalParamsRef = useRef(modalParams);
  modalParamsRef.current = modalParams;
  const openRef = useRef(open);
  openRef.current = open;

  const matchIdRef = useRef(matchId);
  matchIdRef.current = matchId;

  const gamePointToDisplay = (p: number): string => {
    if (p === 0) return "0";
    if (p === 1) return "15";
    if (p === 2) return "30";
    if (p === 3) return "40";
    if (p === 4) return "AD";
    return String(p);
  };

  return {
    matchId,
    router,
    ...local,
    pendingEditScore: session.pendingEditScore,
    setPendingEdit,
    activeModal,
    modalParams,
    open,
    close,
    closeAll,
    session,
    clearPendingEdit,
    updateScore,
    modalParamsRef,
    openRef,
    matchIdRef,
    isOnline,
    enqueue,
    clearQueueForMatch,
    removeLastAction,
    syncPendingMatches,
    ...sync,
    toast,
    gamePointToDisplay,
    timelinePoints,
    fetchTimelinePoints,
    fetchPointLogAudioMeta,
    comments,
    setComments,
    fetchComments,
  };
}
