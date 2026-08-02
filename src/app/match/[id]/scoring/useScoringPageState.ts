"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, TimelinePoint } from "@/core/scoring/types";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useOfflineMatchSync } from "@/hooks/useOfflineMatchSync";
import { useScoreboardUIState } from "@/hooks/useScoreboardUIState";
import { useToast } from "@/components/Toast";
import { useModalStack } from "@/hooks/useModalStack";
import { useSession } from "@/contexts/SessionContext";
import type { SessionData } from "@/contexts/SessionContext";
import type { MatchData } from "@/hooks/useScoringHandlers";
import type { SuspendedSessionState } from "@/hooks/useSessionManager";
import type { QueuedAction } from "@/schemas/contracts";
import { enrichPointsFromHistory } from "@/components/scoring/timeline-utils";

export interface ScoringPageState {
  matchId: string;
  router: ReturnType<typeof useRouter>;
  match: MatchData | null;
  setMatch: React.Dispatch<React.SetStateAction<MatchData | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  scoreState: ScoringState | null;
  setScoreState: React.Dispatch<React.SetStateAction<ScoringState | null>>;
  elapsed: number;
  setElapsed: React.Dispatch<React.SetStateAction<number>>;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  setupLoading: boolean;
  setSetupLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fontScale: number;
  setFontScale: React.Dispatch<React.SetStateAction<number>>;
  pointsHistory: string[];
  setPointsHistory: React.Dispatch<React.SetStateAction<string[]>>;
  showFinishedBanner: boolean;
  setShowFinishedBanner: React.Dispatch<React.SetStateAction<boolean>>;
  serveErrorState: ReturnType<typeof useScoreboardUIState>["state"];
  handleServeErrorOpen: ReturnType<typeof useScoreboardUIState>["handleServeErrorOpen"];
  handleServeErrorClose: ReturnType<typeof useScoreboardUIState>["handleServeErrorClose"];
  handleFirstServeErrorSet: ReturnType<typeof useScoreboardUIState>["handleFirstServeErrorSet"];
  handleFirstServeErrorClear: ReturnType<typeof useScoreboardUIState>["handleFirstServeErrorClear"];
  setServeStep: ReturnType<typeof useScoreboardUIState>["setServeStep"];
  pointSequenceRef: React.MutableRefObject<number>;
  sessionIdRef: React.MutableRefObject<string | null>;
  suspendedSession: SuspendedSessionState | null;
  setSuspendedSession: React.Dispatch<React.SetStateAction<SuspendedSessionState | null>>;
  pendingEditScore: {
    scoreState: ScoringState;
    floorSets: { player1: number; player2: number } | null;
  } | null;
  setPendingEditScore: React.Dispatch<React.SetStateAction<{
    scoreState: ScoringState;
    floorSets: { player1: number; player2: number } | null;
  } | null>>;
  floorCurrentSets: { player1: number; player2: number } | null;
  setFloorCurrentSets: React.Dispatch<React.SetStateAction<{ player1: number; player2: number } | null>>;
  viewMode: "scoring" | "timeline";
  setViewMode: React.Dispatch<React.SetStateAction<"scoring" | "timeline">>;
  undoTimestamp: number | null;
  setUndoTimestamp: React.Dispatch<React.SetStateAction<number | null>>;
  isProcessingRef: React.MutableRefObject<boolean>;
  debounceTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  tokenRef: React.MutableRefObject<string | null>;
  sessionActive: boolean;
  setSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
  activeModal: string | null;
  modalParams: Record<string, string>;
  open: (name: string, params?: Record<string, string>) => void;
  close: () => void;
  closeAll: () => void;
  session: SessionData;
  clearPendingEdit: () => void;
  updateScore: (state: ScoringState) => void;
  modalParamsRef: React.MutableRefObject<Record<string, string>>;
  openRef: React.MutableRefObject<(name: string, params?: Record<string, string>) => void>;
  matchIdRef: React.MutableRefObject<string>;
  engineRef: React.MutableRefObject<ReturnType<typeof ScoringEngine.fromSerialized> | null>;
  isOnline: boolean;
  enqueue: (action: Omit<QueuedAction, "id" | "status" | "retries">) => Promise<QueuedAction>;
  syncPendingMatches: () => Promise<void>;
  syncStatus: "offline" | "syncing" | "synced";
  setSyncStatus: React.Dispatch<React.SetStateAction<"offline" | "syncing" | "synced">>;
  toast: (options: { type: import("@/components/Toast").ToastType; message: string }) => void;
  gamePointToDisplay: (p: number) => string;
  timelinePoints: TimelinePoint[];
}

export function useScoringPageState(matchId: string): ScoringPageState {
  const router = useRouter();
  const { enqueue, isOnline } = useOfflineSync();
  const { syncPendingMatches } = useOfflineMatchSync();
  const { toast } = useToast();

  const [syncStatus, setSyncStatus] = useState<"offline" | "syncing" | "synced">(
    isOnline ? "synced" : "offline"
  );

  const [match, setMatch] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const engineRef = useRef<ReturnType<typeof ScoringEngine.fromSerialized> | null>(null);
  const [scoreState, setScoreState] = useState<ScoringState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [setupLoading, setSetupLoading] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [pointsHistory, setPointsHistory] = useState<string[]>([]);
  const [showFinishedBanner, setShowFinishedBanner] = useState(false);
  const {
    state: serveErrorState,
    handleServeErrorOpen,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    setServeStep,
  } = useScoreboardUIState();

  const pointSequenceRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const [suspendedSession, setSuspendedSession] =
    useState<SuspendedSessionState | null>(null);
  const [pendingEditScore, setPendingEditScore] = useState<{
    scoreState: ScoringState;
    floorSets: { player1: number; player2: number } | null;
  } | null>(null);
  const [floorCurrentSets, setFloorCurrentSets] = useState<{
    player1: number;
    player2: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"scoring" | "timeline">("scoring");
  const [undoTimestamp, setUndoTimestamp] = useState<number | null>(null);
  const isProcessingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokenRef = useRef<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);

  const { activeModal, modalParams, open, close, closeAll } =
    useModalStack({ mode: 'internal' });
  const { session, clearPendingEdit, updateScore } = useSession();
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

  const timelinePoints: TimelinePoint[] = engineRef.current && match
    ? enrichPointsFromHistory(
        engineRef.current.getPointHistory(),
        match.player1.id,
        match.player2.id,
      )
    : [];

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
    handleServeErrorOpen,
    handleServeErrorClose,
    handleFirstServeErrorSet,
    handleFirstServeErrorClear,
    setServeStep,
    pointSequenceRef,
    sessionIdRef,
    suspendedSession,
    setSuspendedSession,
    pendingEditScore,
    setPendingEditScore,
    floorCurrentSets,
    setFloorCurrentSets,
    viewMode,
    setViewMode,
    undoTimestamp,
    setUndoTimestamp,
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
    syncPendingMatches,
    syncStatus,
    setSyncStatus,
    toast,
    gamePointToDisplay,
    timelinePoints,
  };
}
