"use client";

import { useState, useRef, useReducer, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useOfflineMatchSync } from "@/hooks/useOfflineMatchSync";
import { useScoreboardUIState } from "@/hooks/useScoreboardUIState";
import { useToast } from "@/components/Toast";
import { useModalStack } from "@/hooks/useModalStack";
import { useSession } from "@/contexts/SessionContext";
import type { MatchData } from "@/hooks/useScoringHandlers";
import type { SuspendedSessionState } from "@/hooks/useSessionManager";
import { scoreReducer } from "@/hooks/useScoreReducer";
import {
  useScoringTimelineSync,
  type MatchCommentData,
} from "./useScoringTimelineSync";
import type { ScoringPageState } from "./useScoringPageState.types";

export type { MatchCommentData };
export type { ScoringPageState } from "./useScoringPageState.types";

export function useScoringPageState(matchId: string): ScoringPageState {
  const router = useRouter();
  const { enqueue, clearQueueForMatch, removeLastAction, isOnline } = useOfflineSync();
  const { syncPendingMatches } = useOfflineMatchSync();
  const { toast } = useToast();

  const [syncStatus, setSyncStatus] = useState<"offline" | "syncing" | "synced" | "auth-required">(
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

  const [match, setMatch] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<ReturnType<typeof ScoringEngine.fromSerialized> | null>(null);
  const [scoreState, setScoreState] = useReducer(scoreReducer, null as ScoringState | null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [setupLoading, setSetupLoading] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [pointsHistory, setPointsHistory] = useState<string[]>([]);
  const [showFinishedBanner, setShowFinishedBanner] = useState(false);
  const {
    state: serveErrorState,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
  } = useScoreboardUIState();

  const pointSequenceRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const [suspendedSession, setSuspendedSession] =
    useState<SuspendedSessionState | null>(null);
  const [floorCurrentSets, setFloorCurrentSets] = useState<{
    player1: number;
    player2: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"scoring" | "timeline">("scoring");
  const [engineTick, setEngineTick] = useState<number | null>(null);
  const isProcessingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokenRef = useRef<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const {
    timelinePoints,
    fetchTimelinePoints,
    fetchPointLogAudioMeta,
    comments,
    setComments,
    fetchComments,
  } = useScoringTimelineSync({
    matchId,
    match,
    scoreState,
    engineRef,
    engineTick,
    tokenRef,
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
    match,
    setMatch,
    isLoading,
    setIsLoading,
    error,
    setError,
    scoreState,
    setScoreState,
    elapsed,
    setElapsed,
    timerRef,
    setupLoading,
    setSetupLoading,
    fontScale,
    setFontScale,
    pointsHistory,
    setPointsHistory,
    showFinishedBanner,
    setShowFinishedBanner,
    serveErrorState,
    openServeErrorModal,
    closeServeErrorModal,
    setFirstServeError,
    clearFirstServeError,
    setServeStep,
    pointSequenceRef,
    sessionIdRef,
    suspendedSession,
    setSuspendedSession,
    pendingEditScore: session.pendingEditScore,
    setPendingEdit,
    floorCurrentSets,
    setFloorCurrentSets,
    viewMode,
    setViewMode,
    engineTick,
    setEngineTick,
    isProcessingRef,
    debounceTimerRef,
    tokenRef,
    sessionActive,
    setSessionActive,
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
    engineRef,
    isOnline,
    enqueue,
    clearQueueForMatch,
    removeLastAction,
    syncPendingMatches,
    syncStatus,
    setSyncStatus,
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
