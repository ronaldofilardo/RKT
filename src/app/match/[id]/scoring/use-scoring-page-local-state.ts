import { useState, useRef, useReducer } from "react";
import { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import { useScoreboardUIState } from "@/hooks/useScoreboardUIState";
import type { MatchData } from "@/hooks/useScoringHandlers";
import type { SuspendedSessionState } from "@/hooks/useSessionManager";
import { scoreReducer } from "@/hooks/useScoreReducer";

export function useScoringPageLocalState() {
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

  return {
    match, setMatch, isLoading, setIsLoading, error, setError,
    engineRef,
    scoreState, setScoreState, elapsed, setElapsed, timerRef,
    setupLoading, setSetupLoading, fontScale, setFontScale,
    pointsHistory, setPointsHistory, showFinishedBanner, setShowFinishedBanner,
    serveErrorState, openServeErrorModal, closeServeErrorModal,
    setFirstServeError, clearFirstServeError, setServeStep,
    pointSequenceRef, sessionIdRef, suspendedSession, setSuspendedSession,
    floorCurrentSets, setFloorCurrentSets, viewMode, setViewMode,
    engineTick, setEngineTick, isProcessingRef, debounceTimerRef, tokenRef,
    sessionActive, setSessionActive,
  };
}
